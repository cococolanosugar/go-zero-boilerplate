package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanEnvAppBindingModel = (*customTitanEnvAppBindingModel)(nil)

type (
	// TitanEnvAppBindingModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanEnvAppBindingModel.
	TitanEnvAppBindingModel interface {
		titanEnvAppBindingModel
	}

	customTitanEnvAppBindingModel struct {
		*defaultTitanEnvAppBindingModel
	}
)

// NewTitanEnvAppBindingModel returns a model for the database table.
func NewTitanEnvAppBindingModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanEnvAppBindingModel {
	return &customTitanEnvAppBindingModel{
		defaultTitanEnvAppBindingModel: newTitanEnvAppBindingModel(conn, c, opts...),
	}
}
