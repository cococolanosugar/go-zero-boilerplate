package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type DeleteSysRoleLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteSysRoleLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysRoleLogic {
	return &DeleteSysRoleLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteSysRoleLogic) DeleteSysRole(in *pb.IdRequest) (*pb.EmptyResponse, error) {
	if in.Id <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	role, err := l.svcCtx.SysRoleModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewCodeError(xerr.RequestParamError, "角色不存在")
		}
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	if role.Code == "ROLE_ADMIN" || role.Code == "admin" {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "超级管理员角色禁止删除")
	}

	// 检查是否有用户关联该角色
	var userCount int64
	checkSql := "SELECT COUNT(*) FROM sys_user_role WHERE role_id = ?"
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &userCount, checkSql, in.Id); err == nil && userCount > 0 {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "该角色下仍有绑定的用户，无法直接删除")
	}

	// 事务级联清理角色及关联表
	err = l.svcCtx.SqlConn.TransactCtx(l.ctx, func(ctx context.Context, session sqlx.Session) error {
		// 1. 删除 sys_role
		delRoleSql := "DELETE FROM sys_role WHERE id = ?"
		if _, err := session.ExecCtx(ctx, delRoleSql, in.Id); err != nil {
			return err
		}
		// 2. 清理 sys_role_menu
		if _, err := session.ExecCtx(ctx, "DELETE FROM sys_role_menu WHERE role_id = ?", in.Id); err != nil {
			return err
		}
		// 3. 清理 sys_role_api
		if _, err := session.ExecCtx(ctx, "DELETE FROM sys_role_api WHERE role_id = ?", in.Id); err != nil {
			return err
		}
		// 4. 清理 sys_role_dept
		if _, err := session.ExecCtx(ctx, "DELETE FROM sys_role_dept WHERE role_id = ?", in.Id); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		l.Errorf("Delete sys_role err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}

