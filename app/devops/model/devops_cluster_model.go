package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ DevopsClusterModel = (*customDevopsClusterModel)(nil)

type (
	// DevopsClusterModel is an interface to be customized, add more methods here,
	// and implement the added methods in customDevopsClusterModel.
	DevopsClusterModel interface {
		devopsClusterModel
	}

	customDevopsClusterModel struct {
		*defaultDevopsClusterModel
	}
)

// NewDevopsClusterModel returns a model for the database table.
func NewDevopsClusterModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) DevopsClusterModel {
	return &customDevopsClusterModel{
		defaultDevopsClusterModel: newDevopsClusterModel(conn, c, opts...),
	}
}
