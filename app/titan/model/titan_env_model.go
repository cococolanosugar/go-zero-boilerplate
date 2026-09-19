package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanEnvModel = (*customTitanEnvModel)(nil)

type (
	// TitanEnvModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanEnvModel.
	TitanEnvModel interface {
		titanEnvModel
	}

	customTitanEnvModel struct {
		*defaultTitanEnvModel
	}
)

// NewTitanEnvModel returns a model for the database table.
func NewTitanEnvModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanEnvModel {
	return &customTitanEnvModel{
		defaultTitanEnvModel: newTitanEnvModel(conn, c, opts...),
	}
}
