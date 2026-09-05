package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysUserLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 创建新员工
func NewCreateSysUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysUserLogic {
	return &CreateSysUserLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateSysUserLogic) CreateSysUser(req *types.CreateSysUserReq) (resp *types.SysIdResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.CreateSysUser(l.ctx, &userClient.CreateSysUserRequest{
		DeptId:   req.DeptId,
		Username: req.Username,
		Password: req.Password,
		RealName: req.RealName,
		Mobile:   req.Mobile,
		Email:    req.Email,
		RoleIds:  req.RoleIds,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysIdResp{
		Id: rpcResp.Id,
	}, nil
}

