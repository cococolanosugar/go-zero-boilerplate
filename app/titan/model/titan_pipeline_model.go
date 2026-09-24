package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanPipelineModel = (*customTitanPipelineModel)(nil)

type (
	// TitanPipelineModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanPipelineModel.
	TitanPipelineModel interface {
		titanPipelineModel
		// ListByPage 分页查询流水线（keyword 对 name/display_name 模糊匹配，已做 LIKE 转义）
		ListByPage(ctx context.Context, category, keyword string, offset, limit int64) ([]*TitanPipeline, int64, error)
	}

	customTitanPipelineModel struct {
		*defaultTitanPipelineModel
	}
)

// NewTitanPipelineModel returns a model for the database table.
func NewTitanPipelineModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanPipelineModel {
	return &customTitanPipelineModel{
		defaultTitanPipelineModel: newTitanPipelineModel(conn, c, opts...),
	}
}

func (m *customTitanPipelineModel) ListByPage(ctx context.Context, category, keyword string, offset, limit int64) ([]*TitanPipeline, int64, error) {
	where := "WHERE 1=1"
	var args []interface{}
	if category != "" {
		where += " AND category = ?"
		args = append(args, category)
	}
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

	var pipelines []*TitanPipeline
	listQuery := fmt.Sprintf("SELECT id, name, display_name, category, git_repo, git_branch, stages, params, triggers, status, description, created_by, create_time, update_time FROM %s %s ORDER BY id DESC LIMIT ?, ?", m.table, where)
	args = append(args, offset, limit)
	if err := m.QueryRowsNoCacheCtx(ctx, &pipelines, listQuery, args...); err != nil {
		return nil, 0, err
	}
	return pipelines, total, nil
}
