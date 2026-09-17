package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ DevopsIntegrationModel = (*customDevopsIntegrationModel)(nil)

type (
	// DevopsIntegrationModel is an interface to be customized, add more methods here,
	// and implement the added methods in customDevopsIntegrationModel.
	DevopsIntegrationModel interface {
		devopsIntegrationModel
	}

	customDevopsIntegrationModel struct {
		*defaultDevopsIntegrationModel
	}
)

// NewDevopsIntegrationModel returns a model for the database table.
func NewDevopsIntegrationModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) DevopsIntegrationModel {
	return &customDevopsIntegrationModel{
		defaultDevopsIntegrationModel: newDevopsIntegrationModel(conn, c, opts...),
	}
}
