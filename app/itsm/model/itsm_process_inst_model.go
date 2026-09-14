package model

import (
	"context"
	"fmt"
	"strings"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ ItsmProcessInstModel = (*customItsmProcessInstModel)(nil)

type (
	ItsmProcessInstModel interface {
		itsmProcessInstModel
		FindPageList(ctx context.Context, page, pageSize int32, viewType string, userId int64, status, priority, keyword string) ([]*ItsmProcessInst, int64, error)
	}

	customItsmProcessInstModel struct {
		*defaultItsmProcessInstModel
	}
)

func NewItsmProcessInstModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) ItsmProcessInstModel {
	return &customItsmProcessInstModel{
		defaultItsmProcessInstModel: newItsmProcessInstModel(conn, c, opts...),
	}
}

func (m *customItsmProcessInstModel) FindPageList(ctx context.Context, page, pageSize int32, viewType string, userId int64, status, priority, keyword string) ([]*ItsmProcessInst, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	whereClauses := []string{"1 = 1"}
	var args []interface{}

	switch viewType {
	case "my_submitted":
		whereClauses = append(whereClauses, "initiator_id = ?")
		args = append(args, userId)
	case "sla_warning":
		whereClauses = append(whereClauses, "sla_status IN ('WARNING', 'BREACHED')")
	case "todo":
		whereClauses = append(whereClauses, "id IN (SELECT inst_id FROM itsm_task WHERE status IN ('READY', 'CLAIMED') AND (assignee_id = ? OR JSON_CONTAINS(candidate_users, CAST(? AS JSON))))")
		args = append(args, userId, userId)
	case "done":
		whereClauses = append(whereClauses, "id IN (SELECT inst_id FROM itsm_task_log WHERE operator_id = ?)")
		args = append(args, userId)
	}

	if status != "" {
		whereClauses = append(whereClauses, "status = ?")
		args = append(args, status)
	}
	if priority != "" {
		whereClauses = append(whereClauses, "priority = ?")
		args = append(args, priority)
	}
	if keyword != "" {
		whereClauses = append(whereClauses, "(title LIKE ? OR ticket_no LIKE ?)")
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

	listQuery := fmt.Sprintf("SELECT %s FROM %s WHERE %s ORDER BY id DESC LIMIT ?, ?", itsmProcessInstRows, m.table, whereSql)
	queryArgs := append(args, offset, pageSize)
	var resp []*ItsmProcessInst
	err = m.QueryRowsNoCacheCtx(ctx, &resp, listQuery, queryArgs...)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}
