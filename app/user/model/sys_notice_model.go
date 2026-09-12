package model

import (
	"context"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ SysNoticeModel = (*customSysNoticeModel)(nil)

type (
	// NoticeFeedItem 带用户已读标识的通知数据结构
	NoticeFeedItem struct {
		Id            int64     `db:"id"`
		NoticeTitle   string    `db:"notice_title"`
		NoticeType    int64     `db:"notice_type"`
		NoticeContent string    `db:"notice_content"`
		Status        int64     `db:"status"`
		CreateBy      string    `db:"create_by"`
		Remark        string    `db:"remark"`
		CreateTime    time.Time `db:"create_time"`
		UpdateTime    time.Time `db:"update_time"`
		IsRead        int64     `db:"is_read"` // 1已读 0未读
	}

	// SysNoticeModel is an interface to be customized, add more methods here,
	// and implement the added methods in customSysNoticeModel.
	SysNoticeModel interface {
		sysNoticeModel
		FindPageList(ctx context.Context, page, pageSize int64, keyword string) ([]*SysNotice, int64, error)
		GetMyNoticeFeed(ctx context.Context, userId int64, limit int64) ([]*NoticeFeedItem, int64, error)
		MarkNoticeRead(ctx context.Context, userId, noticeId int64) error
		MarkAllNoticesRead(ctx context.Context, userId int64, noticeType int64) error
	}

	customSysNoticeModel struct {
		*defaultSysNoticeModel
	}
)

// NewSysNoticeModel returns a model for the database table.
func NewSysNoticeModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) SysNoticeModel {
	return &customSysNoticeModel{
		defaultSysNoticeModel: newSysNoticeModel(conn, c, opts...),
	}
}

// FindPageList 分页条件查询
func (m *customSysNoticeModel) FindPageList(ctx context.Context, page, pageSize int64, keyword string) ([]*SysNotice, int64, error) {
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
		countQuery += " WHERE `notice_title` LIKE ?"
		countArgs = append(countArgs, "%"+keyword+"%")
	}

	err := m.QueryRowNoCacheCtx(ctx, &total, countQuery, countArgs...)
	if err != nil {
		return nil, 0, err
	}

	var listArgs []any
	listQuery := fmt.Sprintf("SELECT %s FROM %s", sysNoticeRows, m.table)
	if keyword != "" {
		listQuery += " WHERE `notice_title` LIKE ?"
		listArgs = append(listArgs, "%"+keyword+"%")
	}
	listQuery += " ORDER BY id DESC LIMIT ?, ?"
	listArgs = append(listArgs, offset, pageSize)

	var list []*SysNotice
	err = m.QueryRowsNoCacheCtx(ctx, &list, listQuery, listArgs...)
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}

// GetMyNoticeFeed 获取当前员工个人通知列表与未读数
func (m *customSysNoticeModel) GetMyNoticeFeed(ctx context.Context, userId int64, limit int64) ([]*NoticeFeedItem, int64, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// 1. 统计未读总数
	var unreadCount int64
	countQuery := "SELECT count(1) FROM sys_notice n LEFT JOIN sys_notice_read r ON n.id = r.notice_id AND r.user_id = ? WHERE n.status = 1 AND r.id IS NULL"
	if err := m.QueryRowNoCacheCtx(ctx, &unreadCount, countQuery, userId); err != nil {
		return nil, 0, err
	}

	// 2. 查询有效通知列表（未读优先，最新优先）
	var list []*NoticeFeedItem
	listQuery := `SELECT 
		n.id, n.notice_title, n.notice_type, n.notice_content, n.status, n.create_by, n.remark, n.create_time, n.update_time,
		CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END AS is_read
	FROM sys_notice n
	LEFT JOIN sys_notice_read r ON n.id = r.notice_id AND r.user_id = ?
	WHERE n.status = 1
	ORDER BY is_read ASC, n.id DESC
	LIMIT ?`

	if err := m.QueryRowsNoCacheCtx(ctx, &list, listQuery, userId, limit); err != nil {
		return nil, 0, err
	}

	return list, unreadCount, nil
}

// MarkNoticeRead 标记单条通知已读
func (m *customSysNoticeModel) MarkNoticeRead(ctx context.Context, userId, noticeId int64) error {
	query := "INSERT IGNORE INTO sys_notice_read (notice_id, user_id, read_time) VALUES (?, ?, NOW())"
	_, err := m.ExecNoCacheCtx(ctx, query, noticeId, userId)
	return err
}

// MarkAllNoticesRead 标记某分类或全部分类通知已读
func (m *customSysNoticeModel) MarkAllNoticesRead(ctx context.Context, userId int64, noticeType int64) error {
	var query string
	var args []any
	if noticeType > 0 {
		query = "INSERT IGNORE INTO sys_notice_read (notice_id, user_id, read_time) SELECT id, ?, NOW() FROM sys_notice WHERE status = 1 AND notice_type = ?"
		args = []any{userId, noticeType}
	} else {
		query = "INSERT IGNORE INTO sys_notice_read (notice_id, user_id, read_time) SELECT id, ?, NOW() FROM sys_notice WHERE status = 1"
		args = []any{userId}
	}
	_, err := m.ExecNoCacheCtx(ctx, query, args...)
	return err
}
