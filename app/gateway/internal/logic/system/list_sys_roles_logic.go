package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysRolesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取角色列表
func NewListSysRolesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysRolesLogic {
	return &ListSysRolesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysRolesLogic) ListSysRoles(req *types.ListSysRolesReq) (resp *types.ListSysRolesResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysRoles(l.ctx, &userClient.ListSysRolesRequest{
		Page:     req.Page,
		PageSize: req.PageSize,
		Keyword:  req.Keyword,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.SysRoleItem
	for _, r := range rpcResp.List {
		list = append(list, &types.SysRoleItem{
			Id:          r.Id,
			Name:        r.Name,
			Code:        r.Code,
			Sort:        r.Sort,
			DataScope:   r.DataScope,
			Status:      r.Status,
			Description: r.Description,
			MenuIds:     r.MenuIds,
			CreateTime:  r.CreateTime,
		})
	}

	return &types.ListSysRolesResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}

