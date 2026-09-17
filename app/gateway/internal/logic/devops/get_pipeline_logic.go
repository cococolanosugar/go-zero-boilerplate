package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetPipelineLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetPipelineLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetPipelineLogic {
	return &GetPipelineLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetPipelineLogic) GetPipeline(req *types.GetPipelineReqVO) (resp *types.PipelineVO, err error) {
	res, err := l.svcCtx.DevopsRpc.GetPipeline(l.ctx, &devops.GetPipelineReq{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}
	vo := toPipelineVO(res.Pipeline)
	return &vo, nil
}
