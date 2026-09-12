package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysNoticeLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateSysNoticeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysNoticeLogic {
	return &UpdateSysNoticeLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateSysNoticeLogic) UpdateSysNotice(in *pb.UpdateSysNoticeRequest) (*pb.EmptyResponse, error) {
	item, err := l.svcCtx.SysNoticeModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	item.NoticeTitle = in.NoticeTitle
	item.NoticeType = in.NoticeType
	item.NoticeContent = in.NoticeContent
	item.Status = in.Status
	item.CreateBy = in.CreateBy
	item.Remark = in.Remark

	err = l.svcCtx.SysNoticeModel.Update(l.ctx, item)
	if err != nil {
		l.Errorf("Update sys_notice err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}
