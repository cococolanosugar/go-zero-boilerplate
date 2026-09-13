package workerlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/worker/model"
	"go-zero-boilerplate/app/worker/rpc/pb"

	"github.com/zeromicro/go-zero/core/logx"
	"go.temporal.io/sdk/client"
)

func toPbTask(t *model.SysAsyncTask) *pb.AsyncTaskItem {
	if t == nil {
		return nil
	}
	lastRun := ""
	if t.LastRunTime.Valid {
		lastRun = t.LastRunTime.Time.Format("2006-01-02 15:04:05")
	}
	return &pb.AsyncTaskItem{
		Id:            t.Id,
		TaskName:      t.TaskName,
		TaskKey:       t.TaskKey,
		TaskType:      t.TaskType,
		CronExpr:      t.CronExpr,
		WorkflowType:  t.WorkflowType,
		TaskQueue:     t.TaskQueue,
		Payload:       t.Payload,
		Status:        t.Status,
		LastRunTime:   lastRun,
		LastRunStatus: t.LastRunStatus,
		Remark:        t.Remark,
		CreateTime:    t.CreateTime.Format("2006-01-02 15:04:05"),
		UpdateTime:    t.UpdateTime.Format("2006-01-02 15:04:05"),
	}
}

// syncTemporalSchedule creates or updates a Temporal Schedule based on task model
func syncTemporalSchedule(ctx context.Context, temporalClient client.Client, task *model.SysAsyncTask) error {
	if temporalClient == nil || task.CronExpr == "" {
		return nil
	}

	scheduleClient := temporalClient.ScheduleClient()
	handle := scheduleClient.GetHandle(ctx, task.TaskKey)

	// Check if already exists in Temporal
	desc, err := handle.Describe(ctx)
	if err == nil && desc != nil {
		if task.Status == 1 {
			_ = handle.Unpause(ctx, client.ScheduleUnpauseOptions{Note: "Task enabled from admin console"})
		} else {
			_ = handle.Pause(ctx, client.SchedulePauseOptions{Note: "Task paused from admin console"})
		}
		logx.WithContext(ctx).Infof("Temporal schedule %s state synced (status: %d)", task.TaskKey, task.Status)
		return nil
	}

	// Prepare payload args
	var arg interface{} = task.TaskKey
	if task.Payload != "" {
		arg = task.Payload
	}

	action := &client.ScheduleWorkflowAction{
		ID:        fmt.Sprintf("schedule-%s", task.TaskKey),
		Workflow:  task.WorkflowType,
		TaskQueue: task.TaskQueue,
		Args:      []interface{}{arg},
	}

	options := client.ScheduleOptions{
		ID: task.TaskKey,
		Spec: client.ScheduleSpec{
			CronExpressions: []string{task.CronExpr},
		},
		Action: action,
		Paused: task.Status != 1,
	}

	_, err = scheduleClient.Create(ctx, options)
	if err != nil {
		logx.WithContext(ctx).Errorf("Failed to create Temporal schedule %s: %v", task.TaskKey, err)
		return err
	}

	logx.WithContext(ctx).Infof("Temporal schedule %s created successfully with cron: %s", task.TaskKey, task.CronExpr)
	return nil
}

// deleteTemporalSchedule deletes a Temporal schedule if it exists
func deleteTemporalSchedule(ctx context.Context, temporalClient client.Client, taskKey string) {
	if temporalClient == nil || taskKey == "" {
		return
	}
	handle := temporalClient.ScheduleClient().GetHandle(ctx, taskKey)
	if err := handle.Delete(ctx); err != nil {
		logx.WithContext(ctx).Errorf("Temporal schedule %s deletion error: %v", taskKey, err)
	} else {
		logx.WithContext(ctx).Infof("Temporal schedule %s deleted successfully", taskKey)
	}
}
