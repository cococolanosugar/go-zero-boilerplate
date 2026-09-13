package workerlogic

import (
	"context"
	"fmt"
	"time"

	"go-zero-boilerplate/app/worker/model"
	"go-zero-boilerplate/app/worker/rpc/internal/svc"
	"go-zero-boilerplate/app/worker/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
	"go.temporal.io/sdk/client"
)

type RunTaskOnceLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewRunTaskOnceLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RunTaskOnceLogic {
	return &RunTaskOnceLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *RunTaskOnceLogic) RunTaskOnce(in *pb.RunTaskOnceReq) (*pb.RunTaskOnceResp, error) {
	task, err := l.svcCtx.SysAsyncTaskModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewErrCode(xerr.RecordNotFound)
		}
		l.Logger.Errorf("SysAsyncTaskModel.FindOne error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	workflowID := fmt.Sprintf("manual-%s-%d", task.TaskKey, time.Now().UnixMilli())
	taskQueue := task.TaskQueue
	if taskQueue == "" {
		taskQueue = l.svcCtx.Config.Temporal.TaskQueue
	}
	if taskQueue == "" {
		taskQueue = "ASYNC_TASK_QUEUE"
	}

	workflowType := task.WorkflowType
	if workflowType == "" {
		workflowType = "DailyReportWorkflow"
	}

	arg := task.TaskKey
	if task.Payload != "" {
		arg = task.Payload
	}

	workflowOptions := client.StartWorkflowOptions{
		ID:        workflowID,
		TaskQueue: taskQueue,
	}

	we, err := l.svcCtx.TemporalClient.ExecuteWorkflow(l.ctx, workflowOptions, workflowType, arg)
	if err != nil {
		l.Logger.Errorf("Temporal ExecuteWorkflow failed: %v", err)
		_ = l.svcCtx.SysAsyncTaskModel.UpdateRunStatus(l.ctx, task.Id, "FAILED", time.Now())
		return nil, xerr.NewCodeError(xerr.ServerCommonError, fmt.Sprintf("Temporal 任务派发失败: %v", err))
	}

	_ = l.svcCtx.SysAsyncTaskModel.UpdateRunStatus(l.ctx, task.Id, "RUNNING", time.Now())

	return &pb.RunTaskOnceResp{
		Success:    true,
		WorkflowId: we.GetID(),
		RunId:      we.GetRunID(),
		Message:    fmt.Sprintf("工作流 %s 已成功触发运行", we.GetID()),
	}, nil
}
