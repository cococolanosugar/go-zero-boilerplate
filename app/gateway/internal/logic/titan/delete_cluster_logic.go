package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteClusterLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteClusterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteClusterLogic {
	return &DeleteClusterLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteClusterLogic) DeleteCluster(req *types.DeleteClusterReqVO) error {
	_, err := l.svcCtx.TitanRpc.DeleteCluster(l.ctx, &titan.DeleteClusterReq{
		Id: req.Id,
	})
	return err
}
