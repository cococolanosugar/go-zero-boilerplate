package task

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	workerClient "go-zero-boilerplate/app/worker/rpc/client/worker"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListTasksLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取异步任务分页列表
func NewListTasksLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListTasksLogic {
	return &ListTasksLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListTasksLogic) ListTasks(req *types.ListTasksReq) (resp *types.ListTasksResp, err error) {
	rpcResp, err := l.svcCtx.WorkerRpc.ListTasks(l.ctx, &workerClient.ListTasksReq{
		Page:     req.Page,
		PageSize: req.PageSize,
		TaskName: req.TaskName,
		TaskKey:  req.TaskKey,
		Status:   req.Status,
	})
	if err != nil {
		return nil, err
	}

	list := make([]types.AsyncTaskItem, 0, len(rpcResp.List))
	for _, item := range rpcResp.List {
		list = append(list, toTypesTask(item))
	}

	return &types.ListTasksResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}

func toTypesTask(in *workerClient.AsyncTaskItem) types.AsyncTaskItem {
	if in == nil {
		return types.AsyncTaskItem{}
	}
	return types.AsyncTaskItem{
		Id:            in.Id,
		TaskName:      in.TaskName,
		TaskKey:       in.TaskKey,
		TaskType:      in.TaskType,
		CronExpr:      in.CronExpr,
		WorkflowType:  in.WorkflowType,
		TaskQueue:     in.TaskQueue,
		Payload:       in.Payload,
		Status:        in.Status,
		LastRunTime:   in.LastRunTime,
		LastRunStatus: in.LastRunStatus,
		Remark:        in.Remark,
		CreateTime:    in.CreateTime,
		UpdateTime:    in.UpdateTime,
	}
}
