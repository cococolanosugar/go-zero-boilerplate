package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlc"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ SysUserModel = (*customSysUserModel)(nil)

type (
	// SysUserModel is an interface to be customized, add more methods here,
	// and implement the added methods in customSysUserModel.
	SysUserModel interface {
		sysUserModel
		FindOneByMobile(ctx context.Context, mobile string) (*SysUser, error)
	}

	customSysUserModel struct {
		*defaultSysUserModel
	}
)

// NewSysUserModel returns a model for the database table.
func NewSysUserModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) SysUserModel {
	return &customSysUserModel{
		defaultSysUserModel: newSysUserModel(conn, c, opts...),
	}
}

func (m *customSysUserModel) FindOneByMobile(ctx context.Context, mobile string) (*SysUser, error) {
	var resp SysUser
	query := fmt.Sprintf("select %s from %s where `mobile` = ? limit 1", sysUserRows, m.table)
	err := m.QueryRowNoCacheCtx(ctx, &resp, query, mobile)
	switch err {
	case nil:
		return &resp, nil
	case sqlc.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}
