package model

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ SysAsyncTaskModel = (*customSysAsyncTaskModel)(nil)

type (
	// SysAsyncTaskModel is an interface to be customized, add more methods here,
	// and implement the added methods in customSysAsyncTaskModel.
	SysAsyncTaskModel interface {
		sysAsyncTaskModel
		FindPageList(ctx context.Context, page, pageSize int64, taskName, taskKey string, status int64) ([]*SysAsyncTask, int64, error)
		UpdateRunStatus(ctx context.Context, id int64, runStatus string, lastRunTime time.Time) error
		UpdateStatus(ctx context.Context, id int64, status int64) error
	}

	customSysAsyncTaskModel struct {
		*defaultSysAsyncTaskModel
	}
)

// NewSysAsyncTaskModel returns a model for the database table.
func NewSysAsyncTaskModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) SysAsyncTaskModel {
	return &customSysAsyncTaskModel{
		defaultSysAsyncTaskModel: newSysAsyncTaskModel(conn, c, opts...),
	}
}

// FindPageList 分页条件查询
func (m *customSysAsyncTaskModel) FindPageList(ctx context.Context, page, pageSize int64, taskName, taskKey string, status int64) ([]*SysAsyncTask, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	var conditions []string
	var args []any

	if taskName != "" {
		conditions = append(conditions, "`task_name` LIKE ?")
		args = append(args, "%"+taskName+"%")
	}
	if taskKey != "" {
		conditions = append(conditions, "`task_key` LIKE ?")
		args = append(args, "%"+taskKey+"%")
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

	listQuery := fmt.Sprintf("SELECT %s FROM %s%s ORDER BY id DESC LIMIT ?, ?", sysAsyncTaskRows, m.table, whereClause)
	listArgs := append(args, offset, pageSize)

	var list []*SysAsyncTask
	err = m.QueryRowsNoCacheCtx(ctx, &list, listQuery, listArgs...)
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}

// UpdateRunStatus 更新任务运行状态与最近执行时间
func (m *customSysAsyncTaskModel) UpdateRunStatus(ctx context.Context, id int64, runStatus string, lastRunTime time.Time) error {
	data, err := m.FindOne(ctx, id)
	if err != nil {
		return err
	}
	data.LastRunStatus = runStatus
	data.LastRunTime.Time = lastRunTime
	data.LastRunTime.Valid = true
	return m.Update(ctx, data)
}

// UpdateStatus 更新任务启用/禁用状态
func (m *customSysAsyncTaskModel) UpdateStatus(ctx context.Context, id int64, status int64) error {
	data, err := m.FindOne(ctx, id)
	if err != nil {
		return err
	}
	data.Status = status
	return m.Update(ctx, data)
}
