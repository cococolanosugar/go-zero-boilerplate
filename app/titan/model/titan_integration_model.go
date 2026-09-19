package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanIntegrationModel = (*customTitanIntegrationModel)(nil)

type (
	// TitanIntegrationModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanIntegrationModel.
	TitanIntegrationModel interface {
		titanIntegrationModel
		// ListByPage 分页查询集成凭证（config 为密文，脱敏在 logic 层处理）
		ListByPage(ctx context.Context, category string, offset, limit int64) ([]*TitanIntegration, int64, error)
	}

	customTitanIntegrationModel struct {
		*defaultTitanIntegrationModel
	}
)

// NewTitanIntegrationModel returns a model for the database table.
func NewTitanIntegrationModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanIntegrationModel {
	return &customTitanIntegrationModel{
		defaultTitanIntegrationModel: newTitanIntegrationModel(conn, c, opts...),
	}
}

func (m *customTitanIntegrationModel) ListByPage(ctx context.Context, category string, offset, limit int64) ([]*TitanIntegration, int64, error) {
	where := "WHERE 1=1"
	var args []interface{}
	if category != "" {
		// 约定 category 一律小写存储，直接等值匹配以命中 idx_category 索引
		where += " AND category = ?"
		args = append(args, category)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s %s", m.table, where)
	if err := m.QueryRowNoCacheCtx(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	var integrations []*TitanIntegration
	listQuery := fmt.Sprintf("SELECT id, name, category, auth_type, config, status, description, created_by, create_time, update_time FROM %s %s ORDER BY id DESC LIMIT ?, ?", m.table, where)
	args = append(args, offset, limit)
	if err := m.QueryRowsNoCacheCtx(ctx, &integrations, listQuery, args...); err != nil {
		return nil, 0, err
	}
	return integrations, total, nil
}
