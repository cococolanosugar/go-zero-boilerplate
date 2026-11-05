package activities

import (
	"context"
	"fmt"
	"time"

	"go-zero-boilerplate/app/worker/contract"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type TitanPipelineActivities struct {
	conn sqlx.SqlConn
}

func NewTitanPipelineActivities(conn sqlx.SqlConn) *TitanPipelineActivities {
	return &TitanPipelineActivities{conn: conn}
}

// UpdateStepStatus 更新步骤执行状态
func (a *TitanPipelineActivities) UpdateStepStatus(ctx context.Context, stepExecId int64, status string, errorMsg string) error {
	logx.WithContext(ctx).Infof("[PipelineActivity] UpdateStepStatus stepExecId=%d status=%s", stepExecId, status)
	query := "UPDATE titan_pipeline_step_exec SET status = ?, error_msg = ? WHERE id = ?"
	_, err := a.conn.ExecCtx(ctx, query, status, errorMsg, stepExecId)
	return err
}

// UpdatePipelineStatus 更新整个流水线运行状态
func (a *TitanPipelineActivities) UpdatePipelineStatus(ctx context.Context, execId int64, status string) error {
	logx.WithContext(ctx).Infof("[PipelineActivity] UpdatePipelineStatus execId=%d status=%s", execId, status)
	now := time.Now()
	var query string
	if status == "RUNNING" {
		query = "UPDATE titan_pipeline_exec SET status = ?, start_time = ? WHERE id = ?"
		_, err := a.conn.ExecCtx(ctx, query, status, now, execId)
		return err
	}
	query = "UPDATE titan_pipeline_exec SET status = ?, end_time = ? WHERE id = ?"
	_, err := a.conn.ExecCtx(ctx, query, status, now, execId)
	return err
}

// ExecuteStep 模拟执行步骤任务
func (a *TitanPipelineActivities) ExecuteStep(ctx context.Context, step contract.PipelineStepInput, params map[string]string) (string, error) {
	logx.WithContext(ctx).Infof("[PipelineActivity] Executing Step: %s (Type: %s)", step.StepName, step.StepType)
	// 记录步骤执行中
	_ = a.UpdateStepStatus(ctx, step.StepExecID, "RUNNING", "")

	// 模拟执行逻辑耗时与结果返回
	time.Sleep(500 * time.Millisecond)

	var resultMsg string
	switch step.StepType {
	case "GIT_CHECKOUT":
		resultMsg = fmt.Sprintf("Checkout branch %s completed", params["git_branch"])
	case "KANIKO_BUILD":
		imageTag := fmt.Sprintf("%s:%s", step.Config["image_repo"], params["image_tag"])
		resultMsg = fmt.Sprintf("Image build and push completed: %s", imageTag)
	case "JENKINS_JOB":
		resultMsg = fmt.Sprintf("Jenkins job %s triggered and finished", step.Config["job_name"])
	case "K8S_DEPLOY", "HELM_DEPLOY":
		resultMsg = fmt.Sprintf("Deployment to cluster applied successfully")
	default:
		resultMsg = fmt.Sprintf("Step %s finished", step.StepName)
	}

	// 标记步骤执行成功
	_ = a.UpdateStepStatus(ctx, step.StepExecID, "SUCCESS", "")
	return resultMsg, nil
}
