package userlogic

import (
	"context"
	"errors"
	"fmt"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetAdminProfileLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetAdminProfileLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAdminProfileLogic {
	return &GetAdminProfileLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetAdminProfileLogic) GetAdminProfile(in *pb.IdRequest) (*pb.AdminProfileResponse, error) {
	userId := in.Id
	if userId <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	// 1. 查询员工主体
	user, err := l.svcCtx.SysUserModel.FindOne(l.ctx, userId)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, xerr.NewErrCode(xerr.UserNotFound)
		}
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// 2. 查询部门名称
	deptName := ""
	if user.DeptId > 0 {
		if dept, err := l.svcCtx.SysDeptModel.FindOne(l.ctx, user.DeptId); err == nil && dept != nil {
			deptName = dept.DeptName
		}
	}

	// 3. 查询绑定的角色代码
	var roles []string
	isSuperAdmin := false
	roleQuery := fmt.Sprintf("SELECT r.code FROM sys_role r INNER JOIN sys_user_role ur ON r.id = ur.role_id WHERE ur.user_id = %d AND r.status = 1", userId)
	var roleRows []struct {
		Code string `db:"code"`
	}
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &roleRows, roleQuery); err == nil {
		for _, r := range roleRows {
			roles = append(roles, r.Code)
			if r.Code == "ROLE_ADMIN" {
				isSuperAdmin = true
			}
		}
	}

	// 4. 查询有权访问的所有菜单和按钮节点
	var menuRows []*model.SysMenu
	if isSuperAdmin {
		// 超级管理员拥有全部可见与启用的菜单及按钮
		menuQuery := "SELECT * FROM sys_menu WHERE status = 1 ORDER BY sort ASC, id ASC"
		_ = l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &menuRows, menuQuery)
	} else {
		menuQuery := fmt.Sprintf(`
			SELECT DISTINCT m.* FROM sys_menu m
			INNER JOIN sys_role_menu rm ON m.id = rm.menu_id
			INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
			WHERE ur.user_id = %d AND m.status = 1
			ORDER BY m.sort ASC, m.id ASC
		`, userId)
		_ = l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &menuRows, menuQuery)
	}

	// 5. 分流：提取按钮权限编码（type=3），组装页面菜单树（type=1或2）
	var permissions []string
	var navMenus []*model.SysMenu

	for _, m := range menuRows {
		if m.Type == 3 {
			if len(m.PermissionCode) > 0 {
				permissions = append(permissions, m.PermissionCode)
			}
		} else {
			navMenus = append(navMenus, m)
		}
	}

	// 递归构建菜单树
	menuTree := buildMenuTree(navMenus, 0)

	return &pb.AdminProfileResponse{
		Id:          user.Id,
		Username:    user.Username,
		RealName:    user.RealName,
		Mobile:      user.Mobile,
		Email:       user.Email,
		Avatar:      user.Avatar,
		DeptName:    deptName,
		Roles:       roles,
		Permissions: permissions,
		Menus:       menuTree,
	}, nil
}

func buildMenuTree(nodes []*model.SysMenu, parentId int64) []*pb.MenuItem {
	var list []*pb.MenuItem
	for _, item := range nodes {
		if item.ParentId == parentId {
			childPb := &pb.MenuItem{
				Id:             item.Id,
				ParentId:       item.ParentId,
				Title:          item.Title,
				Type:           int32(item.Type),
				Path:           item.Path,
				Component:      item.Component,
				PermissionCode: item.PermissionCode,
				Icon:           item.Icon,
				Sort:           int32(item.Sort),
				Children:       buildMenuTree(nodes, item.Id),
			}
			list = append(list, childPb)
		}
	}
	return list
}