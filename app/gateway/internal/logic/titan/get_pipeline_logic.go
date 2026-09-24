package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
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
	res, err := l.svcCtx.TitanRpc.GetPipeline(l.ctx, &titan.GetPipelineReq{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}
	vo := toPipelineVO(res.Pipeline)
	return &vo, nil
}
