package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ ItsmSlaPolicyModel = (*customItsmSlaPolicyModel)(nil)

type (
	ItsmSlaPolicyModel interface {
		itsmSlaPolicyModel
		ListAll(ctx context.Context) ([]*ItsmSlaPolicy, error)
		FindByPriority(ctx context.Context, priority string) (*ItsmSlaPolicy, error)
	}

	customItsmSlaPolicyModel struct {
		*defaultItsmSlaPolicyModel
	}
)

func NewItsmSlaPolicyModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) ItsmSlaPolicyModel {
	return &customItsmSlaPolicyModel{
		defaultItsmSlaPolicyModel: newItsmSlaPolicyModel(conn, c, opts...),
	}
}

func (m *customItsmSlaPolicyModel) ListAll(ctx context.Context) ([]*ItsmSlaPolicy, error) {
	query := fmt.Sprintf("SELECT %s FROM %s ORDER BY id ASC", itsmSlaPolicyRows, m.table)
	var resp []*ItsmSlaPolicy
	err := m.QueryRowsNoCacheCtx(ctx, &resp, query)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *customItsmSlaPolicyModel) FindByPriority(ctx context.Context, priority string) (*ItsmSlaPolicy, error) {
	query := fmt.Sprintf("SELECT %s FROM %s WHERE priority = ? LIMIT 1", itsmSlaPolicyRows, m.table)
	var resp ItsmSlaPolicy
	err := m.QueryRowNoCacheCtx(ctx, &resp, query, priority)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}
