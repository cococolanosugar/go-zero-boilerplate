package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetStepLogLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetStepLogLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetStepLogLogic {
	return &GetStepLogLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetStepLogLogic) GetStepLog(req *types.GetStepLogReqVO) (resp *types.GetStepLogRespVO, err error) {
	res, err := l.svcCtx.DevopsRpc.GetStepLog(l.ctx, &devops.GetStepLogReq{
		StepExecId: req.Id,
		Offset:     req.Offset,
	})
	if err != nil {
		return nil, err
	}

	return &types.GetStepLogRespVO{
		Content:    res.Content,
		NextOffset: res.NextOffset,
		IsEnd:      res.IsEnd,
	}, nil
}
