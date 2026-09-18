package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanIntegrationModel = (*customTitanIntegrationModel)(nil)

type (
	// TitanIntegrationModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanIntegrationModel.
	TitanIntegrationModel interface {
		titanIntegrationModel
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
