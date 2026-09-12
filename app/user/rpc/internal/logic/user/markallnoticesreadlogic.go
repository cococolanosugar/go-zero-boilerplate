package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type MarkAllNoticesReadLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewMarkAllNoticesReadLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MarkAllNoticesReadLogic {
	return &MarkAllNoticesReadLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *MarkAllNoticesReadLogic) MarkAllNoticesRead(in *pb.MarkAllNoticesReadRequest) (*pb.EmptyResponse, error) {
	if err := l.svcCtx.SysNoticeModel.MarkAllNoticesRead(l.ctx, in.UserId, in.NoticeType); err != nil {
		return nil, xerr.NewErrMsg("全部标记已读失败: " + err.Error())
	}

	return &pb.EmptyResponse{}, nil
}
