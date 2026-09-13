package model

import (
	"context"
	"fmt"
	"strings"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ SysPortalNavModel = (*customSysPortalNavModel)(nil)

type (
	// SysPortalNavModel is an interface to be customized, add more methods here,
	// and implement the added methods in customSysPortalNavModel.
	SysPortalNavModel interface {
		sysPortalNavModel
		FindListByStatus(ctx context.Context, status int64, env string) ([]*SysPortalNav, error)
		FindPageList(ctx context.Context, page, pageSize int64, title, category, env string, status int64) ([]*SysPortalNav, int64, error)
	}

	customSysPortalNavModel struct {
		*defaultSysPortalNavModel
	}
)

// NewSysPortalNavModel returns a model for the database table.
func NewSysPortalNavModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) SysPortalNavModel {
	return &customSysPortalNavModel{
		defaultSysPortalNavModel: newSysPortalNavModel(conn, c, opts...),
	}
}

// FindListByStatus 查询指定状态与环境的导航列表 (按权重降序、ID升序)
func (m *customSysPortalNavModel) FindListByStatus(ctx context.Context, status int64, env string) ([]*SysPortalNav, error) {
	var conditions []string
	var args []any

	if status >= 0 {
		conditions = append(conditions, "`status` = ?")
		args = append(args, status)
	}
	if env != "" && env != "ALL" {
		conditions = append(conditions, "`env` = ?")
		args = append(args, env)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	query := fmt.Sprintf("SELECT %s FROM %s%s ORDER BY `sort` DESC, `id` ASC", sysPortalNavRows, m.table, whereClause)

	var list []*SysPortalNav
	err := m.QueryRowsNoCacheCtx(ctx, &list, query, args...)
	if err != nil {
		return nil, err
	}
	return list, nil
}

// FindPageList 分页多条件查询 (支持标题、分类、环境与状态)
func (m *customSysPortalNavModel) FindPageList(ctx context.Context, page, pageSize int64, title, category, env string, status int64) ([]*SysPortalNav, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	var conditions []string
	var args []any

	if title != "" {
		conditions = append(conditions, "`title` LIKE ?")
		args = append(args, "%"+title+"%")
	}
	if category != "" {
		conditions = append(conditions, "`category` = ?")
		args = append(args, category)
	}
	if env != "" && env != "ALL" {
		conditions = append(conditions, "`env` = ?")
		args = append(args, env)
	}
	if status >= 0 {
		conditions = append(conditions, "`status` = ?")
		args = append(args, status)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT count(1) FROM %s%s", m.table, whereClause)
	err := m.QueryRowNoCacheCtx(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	listQuery := fmt.Sprintf("SELECT %s FROM %s%s ORDER BY `sort` DESC, `id` ASC LIMIT ?, ?", sysPortalNavRows, m.table, whereClause)
	listArgs := append(args, offset, pageSize)

	var list []*SysPortalNav
	err = m.QueryRowsNoCacheCtx(ctx, &list, listQuery, listArgs...)
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}
