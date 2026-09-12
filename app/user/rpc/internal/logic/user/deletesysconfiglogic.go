package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteSysConfigLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteSysConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysConfigLogic {
	return &DeleteSysConfigLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteSysConfigLogic) DeleteSysConfig(in *pb.IdRequest) (*pb.EmptyResponse, error) {
	err := l.svcCtx.SysConfigModel.Delete(l.ctx, in.Id)
	if err != nil {
		l.Errorf("Delete sys_config err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}
	return &pb.EmptyResponse{}, nil
}
