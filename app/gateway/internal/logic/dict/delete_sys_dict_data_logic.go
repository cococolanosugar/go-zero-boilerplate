package dict

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteSysDictDataLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteSysDictDataLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysDictDataLogic {
	return &DeleteSysDictDataLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteSysDictDataLogic) DeleteSysDictData(req *types.SysIdReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.UserRpc.DeleteSysDictData(l.ctx, &userClient.IdRequest{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{Success: true}, nil
}
