package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysUserLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 更新员工信息
func NewUpdateSysUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysUserLogic {
	return &UpdateSysUserLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateSysUserLogic) UpdateSysUser(req *types.UpdateSysUserReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.UserRpc.UpdateSysUser(l.ctx, &userClient.UpdateSysUserRequest{
		Id:       req.Id,
		DeptId:   req.DeptId,
		RealName: req.RealName,
		Mobile:   req.Mobile,
		Email:    req.Email,
		Status:   req.Status,
		RoleIds:  req.RoleIds,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{
		Success: true,
	}, nil
}

