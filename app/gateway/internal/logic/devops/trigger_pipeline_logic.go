package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type TriggerPipelineLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewTriggerPipelineLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TriggerPipelineLogic {
	return &TriggerPipelineLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *TriggerPipelineLogic) TriggerPipeline(req *types.TriggerPipelineReqVO) (resp *types.TriggerPipelineRespVO, err error) {
	userId := getUserIdFromCtx(l.ctx)
	res, err := l.svcCtx.DevopsRpc.TriggerPipeline(l.ctx, &devops.TriggerPipelineReq{
		PipelineId:    req.Id,
		TriggerType:   req.TriggerType,
		TriggerBy:     userId,
		GitBranch:     req.GitBranch,
		GitCommit:     req.GitCommit,
		RuntimeParams: req.RuntimeParams,
	})
	if err != nil {
		return nil, err
	}
	return &types.TriggerPipelineRespVO{
		ExecId: res.ExecId,
		ExecNo: res.ExecNo,
	}, nil
}
