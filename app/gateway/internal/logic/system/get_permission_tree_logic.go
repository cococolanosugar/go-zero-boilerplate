package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/perm"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetPermissionTreeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取系统全量功能权限树
func NewGetPermissionTreeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetPermissionTreeLogic {
	return &GetPermissionTreeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetPermissionTreeLogic) GetPermissionTree() (resp *types.GetPermissionTreeResp, err error) {
	groups := perm.All()
	var list []*types.PermissionGroup

	for _, g := range groups {
		var perms []*types.PermissionItem
		for _, p := range g.Permissions {
			perms = append(perms, &types.PermissionItem{
				Code: p.Code,
				Name: p.Name,
			})
		}
		list = append(list, &types.PermissionGroup{
			Key:         g.Key,
			Title:       g.Title,
			Permissions: perms,
		})
	}

	return &types.GetPermissionTreeResp{List: list}, nil
}
