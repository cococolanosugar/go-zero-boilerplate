package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteSysUserLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 删除员工
func NewDeleteSysUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysUserLogic {
	return &DeleteSysUserLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteSysUserLogic) DeleteSysUser(req *types.SysIdReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.UserRpc.DeleteSysUser(l.ctx, &userClient.IdRequest{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{
		Success: true,
	}, nil
}

