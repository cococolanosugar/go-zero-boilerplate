package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteSysNoticeLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteSysNoticeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysNoticeLogic {
	return &DeleteSysNoticeLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteSysNoticeLogic) DeleteSysNotice(in *pb.IdRequest) (*pb.EmptyResponse, error) {
	err := l.svcCtx.SysNoticeModel.Delete(l.ctx, in.Id)
	if err != nil {
		l.Errorf("Delete sys_notice err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}
	return &pb.EmptyResponse{}, nil
}
