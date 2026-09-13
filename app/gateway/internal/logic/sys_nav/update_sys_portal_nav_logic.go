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

type UpdateSysPortalNavLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 更新系统导航站点
func NewUpdateSysPortalNavLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysPortalNavLogic {
	return &UpdateSysPortalNavLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateSysPortalNavLogic) UpdateSysPortalNav(req *types.UpdateSysPortalNavReq) (resp *types.UpdateSysPortalNavResp, err error) {
	_, err = l.svcCtx.UserRpc.UpdateSysPortalNav(l.ctx, &userClient.UpdateSysPortalNavRequest{
		Id:          req.Id,
		Title:       req.Title,
		Category:    req.Category,
		Url:         req.Url,
		Icon:        req.Icon,
		Description: req.Description,
		Tags:        req.Tags,
		Sort:        req.Sort,
		Target:      req.Target,
		Status:      req.Status,
		Env:         req.Env,
	})
	if err != nil {
		return nil, err
	}

	return &types.UpdateSysPortalNavResp{
		Success: true,
	}, nil
}
