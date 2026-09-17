package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
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
	_, err := l.svcCtx.DevopsRpc.DeletePipeline(l.ctx, &devops.DeletePipelineReq{
		Id: req.Id,
	})
	return err
}
