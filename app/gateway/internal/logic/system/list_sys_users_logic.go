package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysUsersLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取员工列表
func NewListSysUsersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysUsersLogic {
	return &ListSysUsersLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysUsersLogic) ListSysUsers(req *types.ListSysUsersReq) (resp *types.ListSysUsersResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysUsers(l.ctx, &userClient.ListSysUsersRequest{
		Page:     req.Page,
		PageSize: req.PageSize,
		Keyword:  req.Keyword,
		DeptId:   req.DeptId,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.SysUserItem
	for _, u := range rpcResp.List {
		list = append(list, &types.SysUserItem{
			Id:         u.Id,
			DeptId:     u.DeptId,
			DeptName:   u.DeptName,
			Username:   u.Username,
			RealName:   u.RealName,
			Mobile:     u.Mobile,
			Email:      u.Email,
			Avatar:     u.Avatar,
			Status:     u.Status,
			RoleNames:  u.RoleNames,
			RoleIds:    u.RoleIds,
			CreateTime: u.CreateTime,
		})
	}

	return &types.ListSysUsersResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}

