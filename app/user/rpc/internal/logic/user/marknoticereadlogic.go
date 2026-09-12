package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type MarkNoticeReadLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewMarkNoticeReadLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MarkNoticeReadLogic {
	return &MarkNoticeReadLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *MarkNoticeReadLogic) MarkNoticeRead(in *pb.MarkNoticeReadRequest) (*pb.EmptyResponse, error) {
	if err := l.svcCtx.SysNoticeModel.MarkNoticeRead(l.ctx, in.UserId, in.NoticeId); err != nil {
		return nil, xerr.NewErrMsg("标记通知已读失败: " + err.Error())
	}

	return &pb.EmptyResponse{}, nil
}
