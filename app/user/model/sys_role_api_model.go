package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ SysRoleApiModel = (*customSysRoleApiModel)(nil)

type (
	// SysRoleApiModel is an interface to be customized, add more methods here,
	// and implement the added methods in customSysRoleApiModel.
	SysRoleApiModel interface {
		sysRoleApiModel
	}

	customSysRoleApiModel struct {
		*defaultSysRoleApiModel
	}
)

// NewSysRoleApiModel returns a model for the database table.
func NewSysRoleApiModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) SysRoleApiModel {
	return &customSysRoleApiModel{
		defaultSysRoleApiModel: newSysRoleApiModel(conn, c, opts...),
	}
}
