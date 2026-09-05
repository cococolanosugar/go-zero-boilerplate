package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysRoleLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 创建角色
func NewCreateSysRoleLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysRoleLogic {
	return &CreateSysRoleLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateSysRoleLogic) CreateSysRole(req *types.CreateSysRoleReq) (resp *types.SysIdResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.CreateSysRole(l.ctx, &userClient.CreateSysRoleRequest{
		Name:        req.Name,
		Code:        req.Code,
		Sort:        req.Sort,
		DataScope:   req.DataScope,
		Description: req.Description,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysIdResp{
		Id: rpcResp.Id,
	}, nil
}

