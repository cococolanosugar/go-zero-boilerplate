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

type ListSysRolesLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysRolesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysRolesLogic {
	return &ListSysRolesLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSysRolesLogic) ListSysRoles(in *pb.ListSysRolesRequest) (*pb.ListSysRolesResponse, error) {
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
	if len(strings.TrimSpace(in.Keyword)) > 0 {
		kw := strings.TrimSpace(in.Keyword)
		whereClauses = append(whereClauses, fmt.Sprintf("(name LIKE '%%%s%%' OR code LIKE '%%%s%%')", kw, kw))
	}

	whereSql := ""
	if len(whereClauses) > 0 {
		whereSql = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// 1. 统计总数
	countSql := fmt.Sprintf("SELECT COUNT(*) FROM sys_role %s", whereSql)
	var total int64
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countSql); err != nil {
		l.Errorf("Count sys_role err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// 2. 分页查询
	querySql := fmt.Sprintf(`
		SELECT id, name, code, sort, data_scope, status, description, create_time
		FROM sys_role
		%s
		ORDER BY sort ASC, id ASC
		LIMIT %d, %d
	`, whereSql, offset, pageSize)

	type roleRow struct {
		Id          int64  `db:"id"`
		Name        string `db:"name"`
		Code        string `db:"code"`
		Sort        int32  `db:"sort"`
		DataScope   int32  `db:"data_scope"`
		Status      int32  `db:"status"`
		Description string `db:"description"`
		CreateTime  string `db:"create_time"`
	}

	var rows []roleRow
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &rows, querySql); err != nil {
		l.Errorf("Query sys_role rows err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	var list []*pb.SysRoleItem
	for _, r := range rows {
		item := &pb.SysRoleItem{
			Id:          r.Id,
			Name:        r.Name,
			Code:        r.Code,
			Sort:        r.Sort,
			DataScope:   r.DataScope,
			Status:      r.Status,
			Description: r.Description,
			CreateTime:  r.CreateTime,
		}

		// 查询该角色已绑定的菜单与权限点 ID 列表（用于前端勾选回显）
		menuSql := fmt.Sprintf("SELECT menu_id FROM sys_role_menu WHERE role_id = %d", r.Id)
		var menuIds []int64
		if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &menuIds, menuSql); err == nil {
			item.MenuIds = menuIds
		}

		list = append(list, item)
	}

	return &pb.ListSysRolesResponse{
		Total: total,
		List:  list,
	}, nil
}
