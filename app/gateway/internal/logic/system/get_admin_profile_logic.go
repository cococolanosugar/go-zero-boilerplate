package system

import (
	"context"
	"encoding/json"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetAdminProfileLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取当前登录员工画像与权限
func NewGetAdminProfileLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAdminProfileLogic {
	return &GetAdminProfileLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetAdminProfileLogic) GetAdminProfile() (resp *types.AdminProfileResp, err error) {
	var userId int64
	if uidVal := l.ctx.Value("userId"); uidVal != nil {
		if uidJson, ok := uidVal.(json.Number); ok {
			if uidInt, err := uidJson.Int64(); err == nil {
				userId = uidInt
			}
		} else if uidInt, ok := uidVal.(int64); ok {
			userId = uidInt
		}
	}
	if userId <= 0 {
		return nil, xerr.NewErrCode(xerr.TokenExpireError)
	}

	rpcResp, err := l.svcCtx.UserRpc.GetAdminProfile(l.ctx, &userClient.IdRequest{
		Id: userId,
	})
	if err != nil {
		return nil, err
	}

	return &types.AdminProfileResp{
		Id:          rpcResp.Id,
		Username:    rpcResp.Username,
		RealName:    rpcResp.RealName,
		Mobile:      rpcResp.Mobile,
		Email:       rpcResp.Email,
		Avatar:      rpcResp.Avatar,
		DeptName:    rpcResp.DeptName,
		Roles:       rpcResp.Roles,
		Permissions: rpcResp.Permissions,
		Menus:       mapMenuItems(rpcResp.Menus),
	}, nil
}

func mapMenuItems(items []*userClient.MenuItem) []*types.SysMenuItem {
	if len(items) == 0 {
		return nil
	}
	var res []*types.SysMenuItem
	for _, item := range items {
		node := &types.SysMenuItem{
			Id:             item.Id,
			ParentId:       item.ParentId,
			Title:          item.Title,
			Type:           item.Type,
			Path:           item.Path,
			Component:      item.Component,
			PermissionCode: item.PermissionCode,
			Icon:           item.Icon,
			Sort:           item.Sort,
			Children:       mapMenuItems(item.Children),
		}
		res = append(res, node)
	}
	return res
}

