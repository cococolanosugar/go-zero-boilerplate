package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysPostLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateSysPostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysPostLogic {
	return &UpdateSysPostLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateSysPostLogic) UpdateSysPost(in *pb.UpdateSysPostRequest) (*pb.EmptyResponse, error) {
	item, err := l.svcCtx.SysPostModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	item.PostCode = in.PostCode
	item.PostName = in.PostName
	item.PostSort = in.PostSort
	item.Status = in.Status
	item.Remark = in.Remark

	err = l.svcCtx.SysPostModel.Update(l.ctx, item)
	if err != nil {
		l.Errorf("Update sys_post err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}
