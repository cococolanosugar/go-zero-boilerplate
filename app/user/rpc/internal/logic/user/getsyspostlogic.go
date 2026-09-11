package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysPostLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetSysPostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysPostLogic {
	return &GetSysPostLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetSysPostLogic) GetSysPost(in *pb.IdRequest) (*pb.SysPostItem, error) {
	item, err := l.svcCtx.SysPostModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	return &pb.SysPostItem{
		Id: item.Id,
		PostCode: item.PostCode,
		PostName: item.PostName,
		PostSort: item.PostSort,
		Status: item.Status,
		Remark: item.Remark,
		CreateTime: item.CreateTime.Format("2006-01-02 15:04:05"),
		UpdateTime: item.UpdateTime.Format("2006-01-02 15:04:05"),
	}, nil
}
