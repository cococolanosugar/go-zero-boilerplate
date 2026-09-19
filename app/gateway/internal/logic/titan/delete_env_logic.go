package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteEnvLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteEnvLogic {
	return &DeleteEnvLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteEnvLogic) DeleteEnv(req *types.DeleteEnvReqVO) error {
	_, err := l.svcCtx.TitanRpc.DeleteEnv(l.ctx, &titan.DeleteEnvReq{
		Id: req.Id,
	})
	return err
}
