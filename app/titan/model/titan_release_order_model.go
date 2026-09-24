package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanReleaseOrderModel = (*customTitanReleaseOrderModel)(nil)

type (
	// TitanReleaseOrderModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanReleaseOrderModel.
	TitanReleaseOrderModel interface {
		titanReleaseOrderModel
		// ListByPage 分页检索发布单
		ListByPage(ctx context.Context, projectId int64, targetEnv, status, keyword string, offset, limit int64) ([]*TitanReleaseOrder, int64, error)
	}

	customTitanReleaseOrderModel struct {
		*defaultTitanReleaseOrderModel
	}
)

// NewTitanReleaseOrderModel returns a model for the database table.
func NewTitanReleaseOrderModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanReleaseOrderModel {
	return &customTitanReleaseOrderModel{
		defaultTitanReleaseOrderModel: newTitanReleaseOrderModel(conn, c, opts...),
	}
}

func (m *customTitanReleaseOrderModel) ListByPage(ctx context.Context, projectId int64, targetEnv, status, keyword string, offset, limit int64) ([]*TitanReleaseOrder, int64, error) {
	where := "WHERE 1=1"
	var args []interface{}
	if projectId > 0 {
		where += " AND `project_id` = ?"
		args = append(args, projectId)
	}
	if targetEnv != "" {
		where += " AND `target_env` = ?"
		args = append(args, targetEnv)
	}
	if status != "" {
		where += " AND `status` = ?"
		args = append(args, status)
	}
	if keyword != "" {
		where += " AND (`order_no` LIKE ? OR `title` LIKE ?)"
		pattern := "%" + keyword + "%"
		args = append(args, pattern, pattern)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s %s", m.table, where)
	if err := m.QueryRowNoCacheCtx(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	if total == 0 || offset >= total {
		return []*TitanReleaseOrder{}, total, nil
	}

	query := fmt.Sprintf("SELECT %s FROM %s %s ORDER BY `id` DESC LIMIT ?, ?", titanReleaseOrderRows, m.table, where)
	pageArgs := append(args, offset, limit)
	var list []*TitanReleaseOrder
	if err := m.QueryRowsNoCacheCtx(ctx, &list, query, pageArgs...); err != nil {
		return nil, 0, err
	}

	return list, total, nil
}
