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

type UpdateSysUserLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateSysUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysUserLogic {
	return &UpdateSysUserLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateSysUserLogic) UpdateSysUser(in *pb.UpdateSysUserRequest) (*pb.EmptyResponse, error) {
	userId := in.Id
	if userId <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	user, err := l.svcCtx.SysUserModel.FindOne(l.ctx, userId)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.UserNotFound)
	}

	user.DeptId = in.DeptId
	user.RealName = in.RealName
	user.Mobile = in.Mobile
	user.Email = in.Email
	user.Status = int64(in.Status)

	err = l.svcCtx.SqlConn.TransactCtx(l.ctx, func(ctx context.Context, session sqlx.Session) error {
		updateUserSql := "UPDATE sys_user SET dept_id = ?, real_name = ?, mobile = ?, email = ?, status = ? WHERE id = ?"
		if _, err := session.ExecCtx(ctx, updateUserSql, user.DeptId, user.RealName, user.Mobile, user.Email, user.Status, user.Id); err != nil {
			return err
		}

		// 重新绑定角色
		if _, err := session.ExecCtx(ctx, "DELETE FROM sys_user_role WHERE user_id = ?", userId); err != nil {
			return err
		}
		if len(in.RoleIds) > 0 {
			var vals []string
			var args []any
			for _, rid := range in.RoleIds {
				vals = append(vals, "(?, ?)")
				args = append(args, userId, rid)
			}
			sql := fmt.Sprintf("INSERT INTO sys_user_role (user_id, role_id) VALUES %s", strings.Join(vals, ", "))
			if _, err := session.ExecCtx(ctx, sql, args...); err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		l.Errorf("UpdateSysUser err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}