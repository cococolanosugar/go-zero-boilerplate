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

type ListSysPortalNavLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 分页查询系统导航配置列表
func NewListSysPortalNavLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysPortalNavLogic {
	return &ListSysPortalNavLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysPortalNavLogic) ListSysPortalNav(req *types.ListSysPortalNavReq) (resp *types.ListSysPortalNavResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysPortalNav(l.ctx, &userClient.ListSysPortalNavRequest{
		Page:     req.Page,
		PageSize: req.PageSize,
		Title:    req.Title,
		Category: req.Category,
		Status:   req.Status,
		Env:      req.Env,
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

	return &types.ListSysPortalNavResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
