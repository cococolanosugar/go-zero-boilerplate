package task

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	workerClient "go-zero-boilerplate/app/worker/rpc/client/worker"

	"github.com/zeromicro/go-zero/core/logx"
)

type RunTaskOnceLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 立即触发执行一次任务
func NewRunTaskOnceLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RunTaskOnceLogic {
	return &RunTaskOnceLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RunTaskOnceLogic) RunTaskOnce(req *types.RunTaskOnceReq) (resp *types.RunTaskOnceResp, err error) {
	rpcResp, err := l.svcCtx.WorkerRpc.RunTaskOnce(l.ctx, &workerClient.RunTaskOnceReq{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.RunTaskOnceResp{
		Success:    rpcResp.Success,
		WorkflowId: rpcResp.WorkflowId,
		RunId:      rpcResp.RunId,
		Message:    rpcResp.Message,
	}, nil
}
