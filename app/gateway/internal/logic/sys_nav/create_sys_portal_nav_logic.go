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

type CreateSysPortalNavLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 创建系统导航站点
func NewCreateSysPortalNavLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysPortalNavLogic {
	return &CreateSysPortalNavLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateSysPortalNavLogic) CreateSysPortalNav(req *types.CreateSysPortalNavReq) (resp *types.CreateSysPortalNavResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.CreateSysPortalNav(l.ctx, &userClient.CreateSysPortalNavRequest{
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

	return &types.CreateSysPortalNavResp{
		Id: rpcResp.Id,
	}, nil
}
