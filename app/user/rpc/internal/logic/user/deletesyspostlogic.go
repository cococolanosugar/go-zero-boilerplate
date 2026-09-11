package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteSysPostLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteSysPostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysPostLogic {
	return &DeleteSysPostLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteSysPostLogic) DeleteSysPost(in *pb.IdRequest) (*pb.EmptyResponse, error) {
	err := l.svcCtx.SysPostModel.Delete(l.ctx, in.Id)
	if err != nil {
		l.Errorf("Delete sys_post err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}
	return &pb.EmptyResponse{}, nil
}
