package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type DeleteSysUserLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteSysUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysUserLogic {
	return &DeleteSysUserLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteSysUserLogic) DeleteSysUser(in *pb.IdRequest) (*pb.EmptyResponse, error) {
	userId := in.Id
	if userId <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}
	if userId == 1 {
		return nil, xerr.NewErrMsg("超级管理员账号禁止删除")
	}

	err := l.svcCtx.SqlConn.TransactCtx(l.ctx, func(ctx context.Context, session sqlx.Session) error {
		if _, err := session.ExecCtx(ctx, "DELETE FROM sys_user WHERE id = ?", userId); err != nil {
			return err
		}
		_, err := session.ExecCtx(ctx, "DELETE FROM sys_user_role WHERE user_id = ?", userId)
		return err
	})

	if err != nil {
		l.Errorf("DeleteSysUser err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}