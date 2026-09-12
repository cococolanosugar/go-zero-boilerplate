package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysNoticeLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateSysNoticeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysNoticeLogic {
	return &CreateSysNoticeLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateSysNoticeLogic) CreateSysNotice(in *pb.CreateSysNoticeRequest) (*pb.IdRequest, error) {
	item := &model.SysNotice{
		NoticeTitle: in.NoticeTitle,
		NoticeType: in.NoticeType,
		NoticeContent: in.NoticeContent,
		Status: in.Status,
		CreateBy: in.CreateBy,
		Remark: in.Remark,
	}

	res, err := l.svcCtx.SysNoticeModel.Insert(l.ctx, item)
	if err != nil {
		l.Errorf("Insert sys_notice err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	newId, _ := res.LastInsertId()
	return &pb.IdRequest{Id: newId}, nil
}
