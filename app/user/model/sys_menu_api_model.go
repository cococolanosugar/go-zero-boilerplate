package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ SysMenuApiModel = (*customSysMenuApiModel)(nil)

type (
	// SysMenuApiModel is an interface to be customized, add more methods here,
	// and implement the added methods in customSysMenuApiModel.
	SysMenuApiModel interface {
		sysMenuApiModel
	}

	customSysMenuApiModel struct {
		*defaultSysMenuApiModel
	}
)

// NewSysMenuApiModel returns a model for the database table.
func NewSysMenuApiModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) SysMenuApiModel {
	return &customSysMenuApiModel{
		defaultSysMenuApiModel: newSysMenuApiModel(conn, c, opts...),
	}
}
