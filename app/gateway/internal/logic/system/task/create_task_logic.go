package task

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	workerClient "go-zero-boilerplate/app/worker/rpc/client/worker"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 新增异步任务
func NewCreateTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateTaskLogic {
	return &CreateTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateTaskLogic) CreateTask(req *types.CreateTaskReq) (resp *types.AsyncTaskItem, err error) {
	rpcResp, err := l.svcCtx.WorkerRpc.CreateTask(l.ctx, &workerClient.CreateTaskReq{
		TaskName:     req.TaskName,
		TaskKey:      req.TaskKey,
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
