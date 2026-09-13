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

type DeleteSysPortalNavLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 删除系统导航站点
func NewDeleteSysPortalNavLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysPortalNavLogic {
	return &DeleteSysPortalNavLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteSysPortalNavLogic) DeleteSysPortalNav(req *types.DeleteSysPortalNavReq) (resp *types.DeleteSysPortalNavResp, err error) {
	_, err = l.svcCtx.UserRpc.DeleteSysPortalNav(l.ctx, &userClient.IdRequest{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.DeleteSysPortalNavResp{
		Success: true,
	}, nil
}
