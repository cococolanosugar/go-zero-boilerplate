package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysPortalNavLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateSysPortalNavLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysPortalNavLogic {
	return &UpdateSysPortalNavLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateSysPortalNavLogic) UpdateSysPortalNav(in *pb.UpdateSysPortalNavRequest) (*pb.EmptyResponse, error) {
	item, err := l.svcCtx.SysPortalNavModel.FindOne(l.ctx, uint64(in.Id))
	if err != nil {
		l.Logger.Errorf("UpdateSysPortalNav FindOne id=%d error: %v", in.Id, err)
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	if in.Title != "" {
		item.Title = in.Title
	}
	if in.Category != "" {
		item.Category = in.Category
	}
	if in.Url != "" {
		item.Url = in.Url
	}
	item.Icon = in.Icon
	item.Description = in.Description
	item.Tags = in.Tags
	item.Sort = int64(in.Sort)
	if in.Target != "" {
		item.Target = in.Target
	}
	if in.Env != "" {
		item.Env = in.Env
	}
	item.Status = int64(in.Status)

	if err := l.svcCtx.SysPortalNavModel.Update(l.ctx, item); err != nil {
		l.Logger.Errorf("UpdateSysPortalNav Update id=%d error: %v", in.Id, err)
		return nil, xerr.NewErrMsg("更新导航站点失败")
	}

	return &pb.EmptyResponse{}, nil
}
