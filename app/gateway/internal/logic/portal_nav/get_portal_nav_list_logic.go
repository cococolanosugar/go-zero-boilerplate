// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package portal_nav

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetPortalNavListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取门户公开网址导航列表
func NewGetPortalNavListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetPortalNavListLogic {
	return &GetPortalNavListLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetPortalNavListLogic) GetPortalNavList(req *types.GetPortalNavListReq) (resp *types.GetPortalNavListResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.GetPortalNavList(l.ctx, &userClient.GetPortalNavListRequest{
		Status: req.Status,
		Env:    req.Env,
	})
	if err != nil {
		return nil, err
	}

	list := make([]types.PortalNavDTO, 0, len(rpcResp.List))
	for _, item := range rpcResp.List {
		list = append(list, types.PortalNavDTO{
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
		})
	}

	return &types.GetPortalNavListResp{
		List: list,
	}, nil
}
