package workerlogic

import (
	"context"

	"go-zero-boilerplate/app/worker/model"
	"go-zero-boilerplate/app/worker/rpc/internal/svc"
	"go-zero-boilerplate/app/worker/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateTaskLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateTaskLogic {
	return &UpdateTaskLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateTaskLogic) UpdateTask(in *pb.UpdateTaskReq) (*pb.AsyncTaskItem, error) {
	task, err := l.svcCtx.SysAsyncTaskModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewErrCode(xerr.RecordNotFound)
		}
		l.Logger.Errorf("SysAsyncTaskModel.FindOne error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	task.TaskName = in.TaskName
	if in.TaskType != "" {
		task.TaskType = in.TaskType
	}
	task.CronExpr = in.CronExpr
	task.WorkflowType = in.WorkflowType
	if in.TaskQueue != "" {
		task.TaskQueue = in.TaskQueue
	}
	task.Payload = in.Payload
	task.Status = in.Status
	task.Remark = in.Remark

	err = l.svcCtx.SysAsyncTaskModel.Update(l.ctx, task)
	if err != nil {
		l.Logger.Errorf("SysAsyncTaskModel.Update error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// Resync Temporal Schedule
	if task.CronExpr != "" {
		if syncErr := syncTemporalSchedule(l.ctx, l.svcCtx.TemporalClient, task); syncErr != nil {
			l.Logger.Errorf("syncTemporalSchedule failed: %v", syncErr)
		}
	}

	return toPbTask(task), nil
}
