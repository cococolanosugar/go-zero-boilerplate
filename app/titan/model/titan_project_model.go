package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanProjectModel = (*customTitanProjectModel)(nil)

type (
	// TitanProjectModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanProjectModel.
	TitanProjectModel interface {
		titanProjectModel
		// ListByPage 分页查询项目（keyword 对 name/display_name 模糊匹配，已做 LIKE 转义）
		ListByPage(ctx context.Context, keyword string, offset, limit int64) ([]*TitanProject, int64, error)
		// CountAppsAndEnvsByProject 按 project_id 聚合应用与环境数量（消除 N+1 计数）
		CountAppsAndEnvsByProject(ctx context.Context, projectIds []int64) (map[int64]*ProjectResourceCount, error)
	}

	// ProjectResourceCount 项目下的应用与环境数量聚合结果
	ProjectResourceCount struct {
		ProjectId int64
		AppCount  int64
		EnvCount  int64
	}

	customTitanProjectModel struct {
		*defaultTitanProjectModel
	}
)

// NewTitanProjectModel returns a model for the database table.
func NewTitanProjectModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanProjectModel {
	return &customTitanProjectModel{
		defaultTitanProjectModel: newTitanProjectModel(conn, c, opts...),
	}
}

func (m *customTitanProjectModel) ListByPage(ctx context.Context, keyword string, offset, limit int64) ([]*TitanProject, int64, error) {
	where := "WHERE 1=1"
	var args []interface{}
	if keyword != "" {
		// 输入已由调用方做 LIKE 转义
		where += " AND (name LIKE ? OR display_name LIKE ?)"
		kw := "%" + keyword + "%"
		args = append(args, kw, kw)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s %s", m.table, where)
	if err := m.QueryRowNoCacheCtx(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	var projects []*TitanProject
	listQuery := fmt.Sprintf("SELECT id, name, display_name, description, owner_id, status, create_time, update_time FROM %s %s ORDER BY id DESC LIMIT ?, ?", m.table, where)
	args = append(args, offset, limit)
	if err := m.QueryRowsNoCacheCtx(ctx, &projects, listQuery, args...); err != nil {
		return nil, 0, err
	}
	return projects, total, nil
}

func (m *customTitanProjectModel) CountAppsAndEnvsByProject(ctx context.Context, projectIds []int64) (map[int64]*ProjectResourceCount, error) {
	result := make(map[int64]*ProjectResourceCount, len(projectIds))
	if len(projectIds) == 0 {
		return result, nil
	}

	placeholders := ""
	for i := range projectIds {
		if i > 0 {
			placeholders += ","
		}
		placeholders += "?"
	}
	args := make([]interface{}, 0, len(projectIds))
	for _, id := range projectIds {
		args = append(args, id)
	}

	// 应用计数聚合
	var appRows []struct {
		ProjectId int64 `db:"project_id"`
		Cnt       int64 `db:"cnt"`
	}
	appQuery := fmt.Sprintf("SELECT project_id, COUNT(*) AS cnt FROM `titan_app` WHERE project_id IN (%s) GROUP BY project_id", placeholders)
	if err := m.QueryRowsNoCacheCtx(ctx, &appRows, appQuery, args...); err != nil {
		return nil, err
	}
	for _, r := range appRows {
		result[r.ProjectId] = &ProjectResourceCount{ProjectId: r.ProjectId, AppCount: r.Cnt}
	}

	// 环境计数聚合（与已有应用计数合并）
	var envRows []struct {
		ProjectId int64 `db:"project_id"`
		Cnt       int64 `db:"cnt"`
	}
	envQuery := fmt.Sprintf("SELECT project_id, COUNT(*) AS cnt FROM `titan_env` WHERE project_id IN (%s) GROUP BY project_id", placeholders)
	if err := m.QueryRowsNoCacheCtx(ctx, &envRows, envQuery, args...); err != nil {
		return nil, err
	}
	for _, r := range envRows {
		if c, ok := result[r.ProjectId]; ok {
			c.EnvCount = r.Cnt
		} else {
			result[r.ProjectId] = &ProjectResourceCount{ProjectId: r.ProjectId, EnvCount: r.Cnt}
		}
	}

	return result, nil
}
