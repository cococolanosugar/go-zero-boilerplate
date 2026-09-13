package activities

import (
	"context"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
)

type TaskActivities struct{}

func NewTaskActivities() *TaskActivities {
	return &TaskActivities{}
}

func (a *TaskActivities) ExecuteTaskStep(ctx context.Context, stepName string, payload string) (string, error) {
	logx.WithContext(ctx).Infof("[Activity] Executing task step: %s, payload: %s", stepName, payload)
	time.Sleep(50 * time.Millisecond)
	return "COMPLETED", nil
}

func (a *TaskActivities) GenerateReport(ctx context.Context, reportName string) (string, error) {
	logx.WithContext(ctx).Infof("[Activity] Generating report: %s at %s", reportName, time.Now().Format(time.RFC3339))
	return "REPORT_SUCCESS", nil
}
