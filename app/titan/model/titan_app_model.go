package model

import (
	"context"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanAppModel = (*customTitanAppModel)(nil)

type (
	// TitanAppModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanAppModel.
	TitanAppModel interface {
		titanAppModel
		// CountByProject 统计项目下的应用数量（删除保护：含应用的项目不可删）
		CountByProject(ctx context.Context, projectId int64) (int64, error)
		// ListLightByPage 分页查询应用（轻量列：不含 deploy_spec/build_config 大字段，详情接口单独取）
		ListLightByPage(ctx context.Context, projectId int64, offset, limit int64) ([]*TitanAppLight, int64, error)
		// FindByIds 批量按 ID 查询应用（消除 N+1）
		FindByIds(ctx context.Context, ids []int64) (map[int64]*TitanAppLight, error)
		// ListLightByProject 查询项目下全部应用（轻量列，按 id 升序）
		ListLightByProject(ctx context.Context, projectId int64) ([]*TitanAppLight, error)
	}

	customTitanAppModel struct {
		*defaultTitanAppModel
	}
)

// NewTitanAppModel returns a model for the database table.
func NewTitanAppModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanAppModel {
	return &customTitanAppModel{
		defaultTitanAppModel: newTitanAppModel(conn, c, opts...),
	}
}

func (m *customTitanAppModel) CountByProject(ctx context.Context, projectId int64) (int64, error) {
	var count int64
	query := fmt.Sprintf("select count(*) from %s where `project_id` = ?", m.table)
	err := m.QueryRowNoCacheCtx(ctx, &count, query, projectId)
	return count, err
}

// TitanAppLight 应用列表轻量结构（不含 deploy_spec/build_config 大字段，
// 供部分列 SELECT 扫描使用——go-zero sqlx 严格模式下列数必须与 struct 字段数一致）
type TitanAppLight struct {
	Id            int64     `db:"id"`
	ProjectId     int64     `db:"project_id"`
	Name          string    `db:"name"`
	DisplayName   string    `db:"display_name"`
	Description   string    `db:"description"`
	IntegrationId int64     `db:"integration_id"`
	RepoUrl       string    `db:"repo_url"`
	DefaultBranch string    `db:"default_branch"`
	Status        int64     `db:"status"`
	CreateTime    time.Time `db:"create_time"`
	UpdateTime    time.Time `db:"update_time"`
}

// titanAppLightColumns 列表轻量列（剔除 deploy_spec / build_config 大字段）
const titanAppLightColumns = "id, project_id, name, display_name, description, integration_id, repo_url, default_branch, status, create_time, update_time"

func (m *customTitanAppModel) ListLightByPage(ctx context.Context, projectId int64, offset, limit int64) ([]*TitanAppLight, int64, error) {
	where := "WHERE 1=1"
	var args []interface{}
	if projectId > 0 {
		where += " AND project_id = ?"
		args = append(args, projectId)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s %s", m.table, where)
	if err := m.QueryRowNoCacheCtx(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	var apps []*TitanAppLight
	listQuery := fmt.Sprintf("SELECT %s FROM %s %s ORDER BY id DESC LIMIT ?, ?", titanAppLightColumns, m.table, where)
	args = append(args, offset, limit)
	if err := m.QueryRowsNoCacheCtx(ctx, &apps, listQuery, args...); err != nil {
		return nil, 0, err
	}
	return apps, total, nil
}

func (m *customTitanAppModel) FindByIds(ctx context.Context, ids []int64) (map[int64]*TitanAppLight, error) {
	result := make(map[int64]*TitanAppLight, len(ids))
	if len(ids) == 0 {
		return result, nil
	}
	placeholders := ""
	args := make([]interface{}, 0, len(ids))
	for i, id := range ids {
		if i > 0 {
			placeholders += ","
		}
		placeholders += "?"
		args = append(args, id)
	}
	var apps []*TitanAppLight
	query := fmt.Sprintf("SELECT %s FROM %s WHERE id IN (%s)", titanAppLightColumns, m.table, placeholders)
	if err := m.QueryRowsNoCacheCtx(ctx, &apps, query, args...); err != nil {
		return nil, err
	}
	for _, a := range apps {
		result[a.Id] = a
	}
	return result, nil
}

func (m *customTitanAppModel) ListLightByProject(ctx context.Context, projectId int64) ([]*TitanAppLight, error) {
	var apps []*TitanAppLight
	query := fmt.Sprintf("SELECT %s FROM %s WHERE project_id = ? ORDER BY id ASC", titanAppLightColumns, m.table)
	err := m.QueryRowsNoCacheCtx(ctx, &apps, query, projectId)
	return apps, err
}
