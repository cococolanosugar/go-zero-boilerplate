package task

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	workerClient "go-zero-boilerplate/app/worker/rpc/client/worker"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取异步任务详情
func NewGetTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTaskLogic {
	return &GetTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetTaskLogic) GetTask(req *types.GetTaskReq) (resp *types.AsyncTaskItem, err error) {
	rpcResp, err := l.svcCtx.WorkerRpc.GetTask(l.ctx, &workerClient.GetTaskReq{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	task := toTypesTask(rpcResp)
	return &task, nil
}
