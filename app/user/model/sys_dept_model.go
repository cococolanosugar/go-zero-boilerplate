package model

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ SysDeptModel = (*customSysDeptModel)(nil)

type (
	// SysDeptModel is an interface to be customized, add more methods here,
	// and implement the added methods in customSysDeptModel.
	SysDeptModel interface {
		sysDeptModel
		FindAll(ctx context.Context, keyword string, status int64) ([]*SysDept, error)
		CheckDeptHasChildren(ctx context.Context, deptId int64) (bool, error)
		CheckDeptHasUsers(ctx context.Context, deptId int64) (bool, error)
		FindChildren(ctx context.Context, deptId int64) ([]*SysDept, error)
		UpdateDeptWithChildren(ctx context.Context, dept *SysDept, oldAncestors string, newAncestors string) error
	}

	customSysDeptModel struct {
		*defaultSysDeptModel
	}
)

// NewSysDeptModel returns a model for the database table.
func NewSysDeptModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) SysDeptModel {
	return &customSysDeptModel{
		defaultSysDeptModel: newSysDeptModel(conn, c, opts...),
	}
}

// FindAll 查询部门列表（可按名称关键词和状态筛选）
func (m *customSysDeptModel) FindAll(ctx context.Context, keyword string, status int64) ([]*SysDept, error) {
	var whereClauses []string
	var args []interface{}

	if len(strings.TrimSpace(keyword)) > 0 {
		whereClauses = append(whereClauses, "dept_name LIKE ?")
		args = append(args, fmt.Sprintf("%%%s%%", strings.TrimSpace(keyword)))
	}
	if status >= 0 {
		whereClauses = append(whereClauses, "status = ?")
		args = append(args, status)
	}

	whereSql := ""
	if len(whereClauses) > 0 {
		whereSql = " WHERE " + strings.Join(whereClauses, " AND ")
	}

	query := fmt.Sprintf("SELECT %s FROM %s %s ORDER BY parent_id ASC, sort ASC, id ASC", sysDeptRows, m.table, whereSql)
	var resp []*SysDept
	err := m.QueryRowsNoCacheCtx(ctx, &resp, query, args...)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// CheckDeptHasChildren 检查是否存在子部门
func (m *customSysDeptModel) CheckDeptHasChildren(ctx context.Context, deptId int64) (bool, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE parent_id = ?", m.table)
	var count int64
	err := m.QueryRowNoCacheCtx(ctx, &count, query, deptId)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// CheckDeptHasUsers 检查是否存在归属员工
func (m *customSysDeptModel) CheckDeptHasUsers(ctx context.Context, deptId int64) (bool, error) {
	query := "SELECT COUNT(*) FROM `sys_user` WHERE dept_id = ?"
	var count int64
	err := m.QueryRowNoCacheCtx(ctx, &count, query, deptId)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// FindChildren 查找所有后代部门
func (m *customSysDeptModel) FindChildren(ctx context.Context, deptId int64) ([]*SysDept, error) {
	query := fmt.Sprintf("SELECT %s FROM %s WHERE FIND_IN_SET(?, ancestors)", sysDeptRows, m.table)
	var resp []*SysDept
	err := m.QueryRowsNoCacheCtx(ctx, &resp, query, deptId)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// UpdateDeptWithChildren 事务更新部门及其所有子部门的 ancestors 链路
func (m *customSysDeptModel) UpdateDeptWithChildren(ctx context.Context, dept *SysDept, oldAncestors string, newAncestors string) error {
	return m.TransactCtx(ctx, func(ctx context.Context, session sqlx.Session) error {
		// 1. 更新当前部门缓存与数据库
		if err := m.Update(ctx, dept); err != nil {
			return err
		}

		// 2. 若祖级链路发生变化，级联更新其所有子孙部门
		if oldAncestors != newAncestors {
			children, err := m.FindChildren(ctx, dept.Id)
			if err != nil && err != sql.ErrNoRows {
				return err
			}

			for _, child := range children {
				// 替换旧前缀
				childNewAncestors := strings.Replace(child.Ancestors, oldAncestors, newAncestors, 1)
				child.Ancestors = childNewAncestors
				if err := m.Update(ctx, child); err != nil {
					return err
				}
			}
		}

		return nil
	})
}
