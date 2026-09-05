package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysMenuTreeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取全量菜单与按钮树
func NewGetSysMenuTreeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysMenuTreeLogic {
	return &GetSysMenuTreeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetSysMenuTreeLogic) GetSysMenuTree() (resp *types.GetSysMenuTreeResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.GetSysMenuTree(l.ctx, &userClient.EmptyRequest{})
	if err != nil {
		return nil, err
	}

	return &types.GetSysMenuTreeResp{
		List: mapMenuItems(rpcResp.List),
	}, nil
}

