package userlogic

import (
	"context"
	"fmt"
	"strings"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysUsersLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysUsersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysUsersLogic {
	return &ListSysUsersLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSysUsersLogic) ListSysUsers(in *pb.ListSysUsersRequest) (*pb.ListSysUsersResponse, error) {
	page := in.Page
	if page <= 0 {
		page = 1
	}
	pageSize := in.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	var whereClauses []string
	if in.DeptId > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("u.dept_id = %d", in.DeptId))
	}
	if len(strings.TrimSpace(in.Keyword)) > 0 {
		kw := strings.TrimSpace(in.Keyword)
		whereClauses = append(whereClauses, fmt.Sprintf("(u.username LIKE '%%%s%%' OR u.real_name LIKE '%%%s%%' OR u.mobile LIKE '%%%s%%')", kw, kw, kw))
	}

	whereSql := ""
	if len(whereClauses) > 0 {
		whereSql = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// 1. 查询总数
	countSql := fmt.Sprintf("SELECT COUNT(*) FROM sys_user u %s", whereSql)
	var total int64
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countSql); err != nil {
		l.Errorf("Count sys_user err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// 2. 分页查询列表
	querySql := fmt.Sprintf(`
		SELECT u.id, u.dept_id, COALESCE(d.dept_name, '') as dept_name, u.username, u.real_name,
		       u.mobile, u.email, u.avatar, u.status, u.create_time
		FROM sys_user u
		LEFT JOIN sys_dept d ON u.dept_id = d.id
		%s
		ORDER BY u.id DESC
		LIMIT %d, %d
	`, whereSql, offset, pageSize)

	type userRow struct {
		Id         int64  `db:"id"`
		DeptId     int64  `db:"dept_id"`
		DeptName   string `db:"dept_name"`
		Username   string `db:"username"`
		RealName   string `db:"real_name"`
		Mobile     string `db:"mobile"`
		Email      string `db:"email"`
		Avatar     string `db:"avatar"`
		Status     int32  `db:"status"`
		CreateTime string `db:"create_time"`
	}

	var rows []userRow
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &rows, querySql); err != nil {
		l.Errorf("Query sys_user rows err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	var list []*pb.SysUserItem
	for _, r := range rows {
		item := &pb.SysUserItem{
			Id:         r.Id,
			DeptId:     r.DeptId,
			DeptName:   r.DeptName,
			Username:   r.Username,
			RealName:   r.RealName,
			Mobile:     r.Mobile,
			Email:      r.Email,
			Avatar:     r.Avatar,
			Status:     r.Status,
			CreateTime: r.CreateTime,
		}

		// 查询该用户绑定的角色
		roleQuery := fmt.Sprintf(`
			SELECT r.id, r.name FROM sys_role r
			INNER JOIN sys_user_role ur ON r.id = ur.role_id
			WHERE ur.user_id = %d
		`, r.Id)
		var roleRows []struct {
			Id   int64  `db:"id"`
			Name string `db:"name"`
		}
		if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &roleRows, roleQuery); err == nil {
			for _, rr := range roleRows {
				item.RoleIds = append(item.RoleIds, rr.Id)
				item.RoleNames = append(item.RoleNames, rr.Name)
			}
		}

		list = append(list, item)
	}

	return &pb.ListSysUsersResponse{
		Total: total,
		List:  list,
	}, nil
}