package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ ItsmTaskModel = (*customItsmTaskModel)(nil)

type (
	ItsmTaskModel interface {
		itsmTaskModel
		FindActiveByInstId(ctx context.Context, instId int64) ([]*ItsmTask, error)
		FindLatestActiveTask(ctx context.Context, instId int64) (*ItsmTask, error)
	}

	customItsmTaskModel struct {
		*defaultItsmTaskModel
	}
)

func NewItsmTaskModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) ItsmTaskModel {
	return &customItsmTaskModel{
		defaultItsmTaskModel: newItsmTaskModel(conn, c, opts...),
	}
}

func (m *customItsmTaskModel) FindActiveByInstId(ctx context.Context, instId int64) ([]*ItsmTask, error) {
	query := fmt.Sprintf("SELECT %s FROM %s WHERE inst_id = ? AND status IN ('READY', 'CLAIMED') ORDER BY id ASC", itsmTaskRows, m.table)
	var resp []*ItsmTask
	err := m.QueryRowsNoCacheCtx(ctx, &resp, query, instId)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *customItsmTaskModel) FindLatestActiveTask(ctx context.Context, instId int64) (*ItsmTask, error) {
	query := fmt.Sprintf("SELECT %s FROM %s WHERE inst_id = ? AND status IN ('READY', 'CLAIMED') ORDER BY id DESC LIMIT 1", itsmTaskRows, m.table)
	var resp ItsmTask
	err := m.QueryRowNoCacheCtx(ctx, &resp, query, instId)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}
