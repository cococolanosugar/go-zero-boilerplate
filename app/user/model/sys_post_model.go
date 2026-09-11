package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ SysPostModel = (*customSysPostModel)(nil)

type (
	// SysPostModel is an interface to be customized, add more methods here,
	// and implement the added methods in customSysPostModel.
	SysPostModel interface {
		sysPostModel
		FindPageList(ctx context.Context, page, pageSize int64, keyword string) ([]*SysPost, int64, error)
	}

	customSysPostModel struct {
		*defaultSysPostModel
	}
)

// NewSysPostModel returns a model for the database table.
func NewSysPostModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) SysPostModel {
	return &customSysPostModel{
		defaultSysPostModel: newSysPostModel(conn, c, opts...),
	}
}

// FindPageList 分页条件查询
func (m *customSysPostModel) FindPageList(ctx context.Context, page, pageSize int64, keyword string) ([]*SysPost, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	var total int64
	countQuery := fmt.Sprintf("SELECT count(1) FROM %s", m.table)
	var countArgs []any
	if keyword != "" {
		countQuery += " WHERE `post_name` LIKE ?"
		countArgs = append(countArgs, "%"+keyword+"%")
	}

	err := m.QueryRowNoCacheCtx(ctx, &total, countQuery, countArgs...)
	if err != nil {
		return nil, 0, err
	}

	var listArgs []any
	listQuery := fmt.Sprintf("SELECT %s FROM %s", sysPostRows, m.table)
	if keyword != "" {
		listQuery += " WHERE `post_name` LIKE ?"
		listArgs = append(listArgs, "%"+keyword+"%")
	}
	listQuery += " ORDER BY id DESC LIMIT ?, ?"
	listArgs = append(listArgs, offset, pageSize)

	var list []*SysPost
	err = m.QueryRowsNoCacheCtx(ctx, &list, listQuery, listArgs...)
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}
