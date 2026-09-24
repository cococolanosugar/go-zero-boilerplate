package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeletePipelineLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeletePipelineLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeletePipelineLogic {
	return &DeletePipelineLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeletePipelineLogic) DeletePipeline(req *types.DeletePipelineReqVO) error {
	_, err := l.svcCtx.TitanRpc.DeletePipeline(l.ctx, &titan.DeletePipelineReq{
		Id: req.Id,
	})
	return err
}
