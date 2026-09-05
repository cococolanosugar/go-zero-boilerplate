package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type AssignRolePermissionsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 分配角色菜单与按钮权限
func NewAssignRolePermissionsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AssignRolePermissionsLogic {
	return &AssignRolePermissionsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *AssignRolePermissionsLogic) AssignRolePermissions(req *types.AssignRolePermReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.UserRpc.AssignRolePermissions(l.ctx, &userClient.AssignRolePermRequest{
		RoleId:  req.RoleId,
		MenuIds: req.MenuIds,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{
		Success: true,
	}, nil
}

