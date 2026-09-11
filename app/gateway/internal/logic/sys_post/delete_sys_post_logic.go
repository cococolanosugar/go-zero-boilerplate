package sys_post

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteSysPostLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteSysPostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysPostLogic {
	return &DeleteSysPostLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteSysPostLogic) DeleteSysPost(req *types.SysIdReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.UserRpc.DeleteSysPost(l.ctx, &userClient.IdRequest{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{}, nil
}
