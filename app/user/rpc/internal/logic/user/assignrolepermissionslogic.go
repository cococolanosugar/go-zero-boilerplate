package userlogic

import (
	"context"
	"fmt"
	"strings"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type AssignRolePermissionsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewAssignRolePermissionsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AssignRolePermissionsLogic {
	return &AssignRolePermissionsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *AssignRolePermissionsLogic) AssignRolePermissions(in *pb.AssignRolePermRequest) (*pb.EmptyResponse, error) {
	roleId := in.RoleId
	if roleId <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	// 核心亮点：使用事务闭环维护 sys_role_menu 并级联同步 sys_role_api (一石二鸟联动)
	err := l.svcCtx.SqlConn.TransactCtx(l.ctx, func(ctx context.Context, session sqlx.Session) error {
		// 1. 清理该角色原有的菜单与按钮关联
		delMenuSql := "DELETE FROM sys_role_menu WHERE role_id = ?"
		if _, err := session.ExecCtx(ctx, delMenuSql, roleId); err != nil {
			return err
		}

		// 2. 清理该角色原有的 API 关联
		delApiSql := "DELETE FROM sys_role_api WHERE role_id = ?"
		if _, err := session.ExecCtx(ctx, delApiSql, roleId); err != nil {
			return err
		}

		// 3. 批量插入新的菜单按钮关联
		if len(in.MenuIds) > 0 {
			var menuValStrs []string
			var menuArgs []any
			for _, mid := range in.MenuIds {
				menuValStrs = append(menuValStrs, "(?, ?)")
				menuArgs = append(menuArgs, roleId, mid)
			}
			insertMenuSql := fmt.Sprintf("INSERT INTO sys_role_menu (role_id, menu_id) VALUES %s", strings.Join(menuValStrs, ", "))
			if _, err := session.ExecCtx(ctx, insertMenuSql, menuArgs...); err != nil {
				return err
			}

			// 4. 级联反查：找出所有勾选的菜单和按钮节点在 sys_menu_api 中绑定的 API 资源
			var idStrs []string
			for _, mid := range in.MenuIds {
				idStrs = append(idStrs, fmt.Sprintf("%d", mid))
			}
			findApisSql := fmt.Sprintf("SELECT DISTINCT api_id FROM sys_menu_api WHERE menu_id IN (%s)", strings.Join(idStrs, ","))
			var apiRows []struct {
				ApiId int64 `db:"api_id"`
			}
			if err := session.QueryRowsCtx(ctx, &apiRows, findApisSql); err == nil && len(apiRows) > 0 {
				// 5. 自动将绑定的 API 写入 sys_role_api 关联表
				var apiValStrs []string
				var apiArgs []any
				for _, r := range apiRows {
					apiValStrs = append(apiValStrs, "(?, ?)")
					apiArgs = append(apiArgs, roleId, r.ApiId)
				}
				insertApiSql := fmt.Sprintf("INSERT INTO sys_role_api (role_id, api_id) VALUES %s", strings.Join(apiValStrs, ", "))
				if _, err := session.ExecCtx(ctx, insertApiSql, apiArgs...); err != nil {
					return err
				}
			}
		}

		return nil
	})

	if err != nil {
		l.Errorf("AssignRolePermissions err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}