package task

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	workerClient "go-zero-boilerplate/app/worker/rpc/client/worker"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 删除异步任务
func NewDeleteTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteTaskLogic {
	return &DeleteTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteTaskLogic) DeleteTask(req *types.DeleteTaskReq) (resp *types.DeleteTaskResp, err error) {
	rpcResp, err := l.svcCtx.WorkerRpc.DeleteTask(l.ctx, &workerClient.DeleteTaskReq{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.DeleteTaskResp{
		Success: rpcResp.Success,
	}, nil
}
