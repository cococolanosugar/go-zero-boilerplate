package workflows

import (
	"time"

	"go-zero-boilerplate/app/worker/contract"
	"go-zero-boilerplate/app/worker/rpc/internal/activities"

	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

// ItsmSlaMonitorWorkflow 负责工单 SLA 倒计时监控与超时升级
func ItsmSlaMonitorWorkflow(ctx workflow.Context, input contract.ItsmSlaInput) (string, error) {
	logger := workflow.GetLogger(ctx)
	logger.Info("Starting ItsmSlaMonitorWorkflow", "ticketId", input.TicketId, "ticketNo", input.TicketNo)

	options := workflow.ActivityOptions{
		StartToCloseTimeout: 1 * time.Minute,
		RetryPolicy: &temporal.RetryPolicy{
			InitialInterval:    time.Second,
			BackoffCoefficient: 2.0,
			MaximumInterval:    10 * time.Second,
			MaximumAttempts:    3,
		},
	}
	ctx = workflow.WithActivityOptions(ctx, options)

	var a *activities.ItsmSlaActivities

	// 1. 响应 SLA 倒计时等待并检测
	if input.ResponseDurationSec > 0 {
		_ = workflow.Sleep(ctx, time.Duration(input.ResponseDurationSec)*time.Second)
		var respStatus string
		err := workflow.ExecuteActivity(ctx, a.CheckResponseSla, input.TicketId).Get(ctx, &respStatus)
		if err != nil {
			logger.Error("CheckResponseSla activity failed", "error", err)
		}
	}

	// 2. 解决 SLA 倒计时等待并检测
	remainSec := input.ResolveDurationSec - input.ResponseDurationSec
	if remainSec > 0 {
		_ = workflow.Sleep(ctx, time.Duration(remainSec)*time.Second)
		var resolveStatus string
		err := workflow.ExecuteActivity(ctx, a.CheckResolveSla, input.TicketId).Get(ctx, &resolveStatus)
		if err != nil {
			logger.Error("CheckResolveSla activity failed", "error", err)
		}
	}

	logger.Info("ItsmSlaMonitorWorkflow completed", "ticketId", input.TicketId)
	return "SLA_MONITORED", nil
}
