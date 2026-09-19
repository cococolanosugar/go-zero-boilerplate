package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanAppModel = (*customTitanAppModel)(nil)

type (
	// TitanAppModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanAppModel.
	TitanAppModel interface {
		titanAppModel
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
