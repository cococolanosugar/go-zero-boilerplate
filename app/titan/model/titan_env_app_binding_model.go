package model

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanEnvAppBindingModel = (*customTitanEnvAppBindingModel)(nil)

type (
	// TitanEnvAppBindingModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanEnvAppBindingModel.
	TitanEnvAppBindingModel interface {
		titanEnvAppBindingModel
		// LockForDeploy 部署幂等锁：原子条件更新将绑定置为 DEPLOYING。
		// 返回 true 表示抢锁成功；false 表示已有部署在进行中（拒绝重复部署）。
		// 绑定记录不存在时返回 ErrNotFound，由调用方决定是否插入首条 DEPLOYING 记录。
		LockForDeploy(ctx context.Context, envId, appId int64) (bool, error)
		// FinishDeploy 以部署结果解锁：仅允许从 DEPLOYING 迁出到终态，
		// 避免覆盖并发状态变更；失败状态应携带可读错误信息。
		FinishDeploy(ctx context.Context, binding *TitanEnvAppBinding, status string) error
		// CountByEnv 统计环境下的绑定数量（删除保护：含绑定的环境不可删）
		CountByEnv(ctx context.Context, envId int64) (int64, error)
		// CountByApp 统计应用在各环境的绑定数量（删除保护：有部署绑定的应用不可删）
		CountByApp(ctx context.Context, appId int64) (int64, error)
		// CountByEnvIds 按 env_id 批量聚合绑定数（消除 N+1 计数）
		CountByEnvIds(ctx context.Context, envIds []int64) (map[int64]int64, error)
		// ListByEnvId 查询环境下的全部绑定（消除 N+1 查询）
		ListByEnvId(ctx context.Context, envId int64) ([]*TitanEnvAppBinding, error)
		// ListByEnvIds 批量按多个环境 ID 查询全部绑定（消除 N+1 查询）
		ListByEnvIds(ctx context.Context, envIds []int64) ([]*TitanEnvAppBinding, error)
	}

	customTitanEnvAppBindingModel struct {
		*defaultTitanEnvAppBindingModel
	}
)

// NewTitanEnvAppBindingModel returns a model for the database table.
func NewTitanEnvAppBindingModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanEnvAppBindingModel {
	return &customTitanEnvAppBindingModel{
		defaultTitanEnvAppBindingModel: newTitanEnvAppBindingModel(conn, c, opts...),
	}
}

func (m *customTitanEnvAppBindingModel) LockForDeploy(ctx context.Context, envId, appId int64) (bool, error) {
	envIdAppIdKey := fmt.Sprintf("%s%v:%v", cacheTitanEnvAppBindingEnvIdAppIdPrefix, envId, appId)
	var locked int64
	_, err := m.ExecCtx(ctx, func(ctx context.Context, conn sqlx.SqlConn) (sql.Result, error) {
		res, err := conn.ExecCtx(ctx,
			fmt.Sprintf("update %s set `status` = ? where `env_id` = ? and `app_id` = ? and `status` != ?", m.table),
			BindingStatusDeploying, envId, appId, BindingStatusDeploying)
		if err != nil {
			return nil, err
		}
		locked, err = res.RowsAffected()
		if err != nil {
			return nil, err
		}
		return res, nil
	}, envIdAppIdKey)
	if err != nil {
		return false, err
	}
	return locked > 0, nil
}

func (m *customTitanEnvAppBindingModel) FinishDeploy(ctx context.Context, binding *TitanEnvAppBinding, status string) error {
	envIdAppIdKey := fmt.Sprintf("%s%v:%v", cacheTitanEnvAppBindingEnvIdAppIdPrefix, binding.EnvId, binding.AppId)
	idKey := fmt.Sprintf("%s%v", cacheTitanEnvAppBindingIdPrefix, binding.Id)
	_, err := m.ExecCtx(ctx, func(ctx context.Context, conn sqlx.SqlConn) (sql.Result, error) {
		return conn.ExecCtx(ctx,
			fmt.Sprintf("update %s set `status` = ? where `id` = ? and `status` = ?", m.table),
			status, binding.Id, BindingStatusDeploying)
	}, envIdAppIdKey, idKey)
	return err
}

func (m *customTitanEnvAppBindingModel) CountByEnv(ctx context.Context, envId int64) (int64, error) {
	var count int64
	query := fmt.Sprintf("select count(*) from %s where `env_id` = ?", m.table)
	err := m.QueryRowNoCacheCtx(ctx, &count, query, envId)
	return count, err
}

func (m *customTitanEnvAppBindingModel) CountByApp(ctx context.Context, appId int64) (int64, error) {
	var count int64
	query := fmt.Sprintf("select count(*) from %s where `app_id` = ?", m.table)
	err := m.QueryRowNoCacheCtx(ctx, &count, query, appId)
	return count, err
}

func (m *customTitanEnvAppBindingModel) CountByEnvIds(ctx context.Context, envIds []int64) (map[int64]int64, error) {
	result := make(map[int64]int64, len(envIds))
	if len(envIds) == 0 {
		return result, nil
	}
	placeholders := ""
	args := make([]interface{}, 0, len(envIds))
	for i, id := range envIds {
		if i > 0 {
			placeholders += ","
		}
		placeholders += "?"
		args = append(args, id)
	}
	var rows []struct {
		EnvId int64 `db:"env_id"`
		Cnt   int64 `db:"cnt"`
	}
	query := fmt.Sprintf("SELECT env_id, COUNT(*) AS cnt FROM %s WHERE env_id IN (%s) GROUP BY env_id", m.table, placeholders)
	if err := m.QueryRowsNoCacheCtx(ctx, &rows, query, args...); err != nil {
		return nil, err
	}
	for _, r := range rows {
		result[r.EnvId] = r.Cnt
	}
	return result, nil
}

func (m *customTitanEnvAppBindingModel) ListByEnvId(ctx context.Context, envId int64) ([]*TitanEnvAppBinding, error) {
	var bindings []*TitanEnvAppBinding
	query := fmt.Sprintf("SELECT id, env_id, app_id, current_artifact_id, ready_replicas, total_replicas, status, last_deployed_time, update_time FROM %s WHERE env_id = ?", m.table)
	err := m.QueryRowsNoCacheCtx(ctx, &bindings, query, envId)
	return bindings, err
}

func (m *customTitanEnvAppBindingModel) ListByEnvIds(ctx context.Context, envIds []int64) ([]*TitanEnvAppBinding, error) {
	if len(envIds) == 0 {
		return []*TitanEnvAppBinding{}, nil
	}
	placeholders := ""
	args := make([]interface{}, 0, len(envIds))
	for i, id := range envIds {
		if i > 0 {
			placeholders += ","
		}
		placeholders += "?"
		args = append(args, id)
	}
	var bindings []*TitanEnvAppBinding
	query := fmt.Sprintf("SELECT id, env_id, app_id, current_artifact_id, ready_replicas, total_replicas, status, last_deployed_time, update_time FROM %s WHERE env_id IN (%s)", m.table, placeholders)
	err := m.QueryRowsNoCacheCtx(ctx, &bindings, query, args...)
	return bindings, err
}
