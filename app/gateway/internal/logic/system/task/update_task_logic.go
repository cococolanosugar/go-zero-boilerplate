package task

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	workerClient "go-zero-boilerplate/app/worker/rpc/client/worker"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 修改异步任务
func NewUpdateTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateTaskLogic {
	return &UpdateTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateTaskLogic) UpdateTask(req *types.UpdateTaskReq) (resp *types.AsyncTaskItem, err error) {
	rpcResp, err := l.svcCtx.WorkerRpc.UpdateTask(l.ctx, &workerClient.UpdateTaskReq{
		Id:           req.Id,
		TaskName:     req.TaskName,
		TaskType:     req.TaskType,
		CronExpr:     req.CronExpr,
		WorkflowType: req.WorkflowType,
		TaskQueue:    req.TaskQueue,
		Payload:      req.Payload,
		Status:       req.Status,
		Remark:       req.Remark,
	})
	if err != nil {
		return nil, err
	}

	task := toTypesTask(rpcResp)
	return &task, nil
}
