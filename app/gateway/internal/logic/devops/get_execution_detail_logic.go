package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetExecutionDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetExecutionDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetExecutionDetailLogic {
	return &GetExecutionDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetExecutionDetailLogic) GetExecutionDetail(req *types.GetExecutionDetailReqVO) (resp *types.ExecutionDetailRespVO, err error) {
	res, err := l.svcCtx.DevopsRpc.GetExecutionDetail(l.ctx, &devops.GetExecutionDetailReq{
		ExecId: req.Id,
	})
	if err != nil {
		return nil, err
	}

	steps := make([]types.StepExecVO, 0, len(res.Steps))
	for _, s := range res.Steps {
		steps = append(steps, toStepExecVO(s))
	}

	return &types.ExecutionDetailRespVO{
		Execution: toExecutionVO(res.Execution),
		Steps:     steps,
	}, nil
}
