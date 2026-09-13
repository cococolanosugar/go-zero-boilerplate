package workflows

import (
	"time"

	"go-zero-boilerplate/app/worker/rpc/internal/activities"

	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

// DailyReportWorkflow demonstrates a scheduled or manual multi-step workflow in Temporal
func DailyReportWorkflow(ctx workflow.Context, taskKey string) (string, error) {
	logger := workflow.GetLogger(ctx)
	logger.Info("Starting DailyReportWorkflow", "taskKey", taskKey)

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

	var a *activities.TaskActivities
	var stepResult string
	err := workflow.ExecuteActivity(ctx, a.ExecuteTaskStep, "CollectData", taskKey).Get(ctx, &stepResult)
	if err != nil {
		return "", err
	}

	var reportResult string
	err = workflow.ExecuteActivity(ctx, a.GenerateReport, taskKey).Get(ctx, &reportResult)
	if err != nil {
		return "", err
	}

	logger.Info("DailyReportWorkflow completed successfully", "taskKey", taskKey)
	return "REPORT_GENERATED", nil
}
