package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanClusterModel = (*customTitanClusterModel)(nil)

type (
	// TitanClusterModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanClusterModel.
	TitanClusterModel interface {
		titanClusterModel
	}

	customTitanClusterModel struct {
		*defaultTitanClusterModel
	}
)

// NewTitanClusterModel returns a model for the database table.
func NewTitanClusterModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanClusterModel {
	return &customTitanClusterModel{
		defaultTitanClusterModel: newTitanClusterModel(conn, c, opts...),
	}
}
