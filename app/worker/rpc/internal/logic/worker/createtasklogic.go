package workerlogic

import (
	"context"

	"go-zero-boilerplate/app/worker/model"
	"go-zero-boilerplate/app/worker/rpc/internal/svc"
	"go-zero-boilerplate/app/worker/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateTaskLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateTaskLogic {
	return &CreateTaskLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateTaskLogic) CreateTask(in *pb.CreateTaskReq) (*pb.AsyncTaskItem, error) {
	// Check if taskKey already exists
	existing, err := l.svcCtx.SysAsyncTaskModel.FindOneByTaskKey(l.ctx, in.TaskKey)
	if err == nil && existing != nil {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "任务标识 TaskKey 已存在")
	}

	taskQueue := in.TaskQueue
	if taskQueue == "" {
		taskQueue = l.svcCtx.Config.Temporal.TaskQueue
	}
	if taskQueue == "" {
		taskQueue = "ORDER_TASK_QUEUE"
	}

	taskType := in.TaskType
	if taskType == "" {
		taskType = "CRON"
	}

	data := &model.SysAsyncTask{
		TaskName:      in.TaskName,
		TaskKey:       in.TaskKey,
		TaskType:      taskType,
		CronExpr:      in.CronExpr,
		WorkflowType:  in.WorkflowType,
		TaskQueue:     taskQueue,
		Payload:       in.Payload,
		Status:        in.Status,
		LastRunStatus: "IDLE",
		Remark:        in.Remark,
	}

	res, err := l.svcCtx.SysAsyncTaskModel.Insert(l.ctx, data)
	if err != nil {
		l.Logger.Errorf("SysAsyncTaskModel.Insert error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	id, err := res.LastInsertId()
	if err == nil {
		data.Id = id
	}

	// Sync with Temporal if cron schedule
	if data.CronExpr != "" {
		if syncErr := syncTemporalSchedule(l.ctx, l.svcCtx.TemporalClient, data); syncErr != nil {
			l.Logger.Errorf("syncTemporalSchedule failed: %v", syncErr)
		}
	}

	return toPbTask(data), nil
}
