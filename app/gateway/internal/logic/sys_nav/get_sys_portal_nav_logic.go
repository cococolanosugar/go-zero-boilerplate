// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package sys_nav

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysPortalNavLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取导航站点详情
func NewGetSysPortalNavLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysPortalNavLogic {
	return &GetSysPortalNavLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetSysPortalNavLogic) GetSysPortalNav(req *types.GetSysPortalNavReq) (resp *types.PortalNavDTO, err error) {
	item, err := l.svcCtx.UserRpc.GetSysPortalNav(l.ctx, &userClient.IdRequest{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.PortalNavDTO{
		Id:          item.Id,
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
		CreateTime:  item.CreateTime,
		UpdateTime:  item.UpdateTime,
	}, nil
}
