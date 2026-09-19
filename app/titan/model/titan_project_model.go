package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanProjectModel = (*customTitanProjectModel)(nil)

type (
	// TitanProjectModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanProjectModel.
	TitanProjectModel interface {
		titanProjectModel
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
