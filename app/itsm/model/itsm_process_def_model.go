package model

import (
	"context"
	"fmt"
	"strings"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ ItsmProcessDefModel = (*customItsmProcessDefModel)(nil)

type (
	ItsmProcessDefModel interface {
		itsmProcessDefModel
		FindPageList(ctx context.Context, page, pageSize int32, category string, status int32, keyword string) ([]*ItsmProcessDef, int64, error)
		FindLatestByProcCode(ctx context.Context, procCode string) (*ItsmProcessDef, error)
	}

	customItsmProcessDefModel struct {
		*defaultItsmProcessDefModel
	}
)

func NewItsmProcessDefModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) ItsmProcessDefModel {
	return &customItsmProcessDefModel{
		defaultItsmProcessDefModel: newItsmProcessDefModel(conn, c, opts...),
	}
}

func (m *customItsmProcessDefModel) FindPageList(ctx context.Context, page, pageSize int32, category string, status int32, keyword string) ([]*ItsmProcessDef, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	whereClauses := []string{"1 = 1"}
	var args []interface{}

	if category != "" {
		whereClauses = append(whereClauses, "category = ?")
		args = append(args, category)
	}
	if status > 0 {
		whereClauses = append(whereClauses, "status = ?")
		args = append(args, status)
	}
	if keyword != "" {
		whereClauses = append(whereClauses, "(proc_name LIKE ? OR proc_code LIKE ?)")
		kw := "%" + keyword + "%"
		args = append(args, kw, kw)
	}

	whereSql := strings.Join(whereClauses, " AND ")
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE %s", m.table, whereSql)
	var total int64
	err := m.QueryRowNoCacheCtx(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	listQuery := fmt.Sprintf("SELECT %s FROM %s WHERE %s ORDER BY id DESC LIMIT ?, ?", itsmProcessDefRows, m.table, whereSql)
	queryArgs := append(args, offset, pageSize)
	var resp []*ItsmProcessDef
	err = m.QueryRowsNoCacheCtx(ctx, &resp, listQuery, queryArgs...)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}

func (m *customItsmProcessDefModel) FindLatestByProcCode(ctx context.Context, procCode string) (*ItsmProcessDef, error) {
	query := fmt.Sprintf("SELECT %s FROM %s WHERE proc_code = ? ORDER BY version DESC LIMIT 1", itsmProcessDefRows, m.table)
	var resp ItsmProcessDef
	err := m.QueryRowNoCacheCtx(ctx, &resp, query, procCode)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}
