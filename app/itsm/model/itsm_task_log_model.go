package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ ItsmTaskLogModel = (*customItsmTaskLogModel)(nil)

type (
	ItsmTaskLogModel interface {
		itsmTaskLogModel
		FindByInstId(ctx context.Context, instId int64) ([]*ItsmTaskLog, error)
	}

	customItsmTaskLogModel struct {
		*defaultItsmTaskLogModel
	}
)

func NewItsmTaskLogModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) ItsmTaskLogModel {
	return &customItsmTaskLogModel{
		defaultItsmTaskLogModel: newItsmTaskLogModel(conn, c, opts...),
	}
}

func (m *customItsmTaskLogModel) FindByInstId(ctx context.Context, instId int64) ([]*ItsmTaskLog, error) {
	query := fmt.Sprintf("SELECT %s FROM %s WHERE inst_id = ? ORDER BY id ASC", itsmTaskLogRows, m.table)
	var resp []*ItsmTaskLog
	err := m.QueryRowsNoCacheCtx(ctx, &resp, query, instId)
	if err != nil {
		return nil, err
	}
	return resp, nil
}
