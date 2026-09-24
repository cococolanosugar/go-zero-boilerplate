package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanEnvModel = (*customTitanEnvModel)(nil)

type (
	// TitanEnvModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanEnvModel.
	TitanEnvModel interface {
		titanEnvModel
		// CountByProject 统计项目下的环境数量（删除保护：含环境的项目不可删）
		CountByProject(ctx context.Context, projectId int64) (int64, error)
		// ListByProject 查询项目下全部环境（按 id 升序）
		ListByProject(ctx context.Context, projectId int64) ([]*TitanEnv, error)
	}

	customTitanEnvModel struct {
		*defaultTitanEnvModel
	}
)

// NewTitanEnvModel returns a model for the database table.
func NewTitanEnvModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanEnvModel {
	return &customTitanEnvModel{
		defaultTitanEnvModel: newTitanEnvModel(conn, c, opts...),
	}
}

func (m *customTitanEnvModel) CountByProject(ctx context.Context, projectId int64) (int64, error) {
	var count int64
	query := fmt.Sprintf("select count(*) from %s where `project_id` = ?", m.table)
	err := m.QueryRowNoCacheCtx(ctx, &count, query, projectId)
	return count, err
}

func (m *customTitanEnvModel) ListByProject(ctx context.Context, projectId int64) ([]*TitanEnv, error) {
	var envs []*TitanEnv
	query := fmt.Sprintf("SELECT id, project_id, env_code, name, cluster_id, namespace, status, create_time, update_time FROM %s WHERE project_id = ? ORDER BY id ASC", m.table)
	err := m.QueryRowsNoCacheCtx(ctx, &envs, query, projectId)
	return envs, err
}
