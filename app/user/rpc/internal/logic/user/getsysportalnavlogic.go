package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysPortalNavLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetSysPortalNavLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysPortalNavLogic {
	return &GetSysPortalNavLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetSysPortalNavLogic) GetSysPortalNav(in *pb.IdRequest) (*pb.PortalNavItem, error) {
	item, err := l.svcCtx.SysPortalNavModel.FindOne(l.ctx, uint64(in.Id))
	if err != nil {
		l.Logger.Errorf("GetSysPortalNav FindOne id=%d error: %v", in.Id, err)
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	return &pb.PortalNavItem{
		Id:          int64(item.Id),
		Title:       item.Title,
		Category:    item.Category,
		Url:         item.Url,
		Icon:        item.Icon,
		Description: item.Description,
		Tags:        item.Tags,
		Sort:        item.Sort,
		Target:      item.Target,
		Status:      item.Status,
		Env:         item.Env,
		CreateTime:  item.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdateTime:  item.UpdatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}
