package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysNoticeLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetSysNoticeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysNoticeLogic {
	return &GetSysNoticeLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetSysNoticeLogic) GetSysNotice(in *pb.IdRequest) (*pb.SysNoticeItem, error) {
	item, err := l.svcCtx.SysNoticeModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	return &pb.SysNoticeItem{
		Id: item.Id,
		NoticeTitle: item.NoticeTitle,
		NoticeType: item.NoticeType,
		NoticeContent: item.NoticeContent,
		Status: item.Status,
		CreateBy: item.CreateBy,
		Remark: item.Remark,
		CreateTime: item.CreateTime.Format("2006-01-02 15:04:05"),
		UpdateTime: item.UpdateTime.Format("2006-01-02 15:04:05"),
	}, nil
}
