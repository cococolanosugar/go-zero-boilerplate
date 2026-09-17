package workflows

import (
	"fmt"
	"time"

	"go-zero-boilerplate/app/worker/contract"
	"go-zero-boilerplate/app/worker/rpc/internal/activities"

	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

// TitanPipelineWorkflow 编排执行 Titan CI/CD 阶段与步骤任务
func TitanPipelineWorkflow(ctx workflow.Context, input contract.TitanPipelineInput) (string, error) {
	logger := workflow.GetLogger(ctx)
	logger.Info("Starting TitanPipelineWorkflow", "execId", input.ExecID, "execNo", input.ExecNo)

	activityOptions := workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Minute,
		RetryPolicy: &temporal.RetryPolicy{
			InitialInterval:    time.Second,
			BackoffCoefficient: 2.0,
			MaximumInterval:    30 * time.Second,
			MaximumAttempts:    3,
		},
	}
	ctx = workflow.WithActivityOptions(ctx, activityOptions)

	var a *activities.DevopsPipelineActivities

	// 1. 标记 Pipeline 进入运行状态
	_ = workflow.ExecuteActivity(ctx, a.UpdatePipelineStatus, input.ExecID, "RUNNING").Get(ctx, nil)

	// 2. 设置信号通道
	approveChannel := workflow.GetSignalChannel(ctx, contract.SignalApproveStep)
	cancelChannel := workflow.GetSignalChannel(ctx, contract.SignalCancelPipeline)

	// 3. 顺序遍历 Stages
	for _, stage := range input.Stages {
		logger.Info("Entering Stage", "stageId", stage.StageID, "stageName", stage.StageName)

		for _, step := range stage.Steps {
			// 检查是否有取消流水线信号
			var cancelMsg string
			if cancelChannel.ReceiveAsync(&cancelMsg) {
				logger.Warn("Pipeline cancelled by user signal", "execId", input.ExecID)
				_ = workflow.ExecuteActivity(ctx, a.UpdatePipelineStatus, input.ExecID, "ABORTED").Get(ctx, nil)
				return "ABORTED", nil
			}

			// 如果是人工审批门禁卡点
			if step.StepType == "APPROVAL" {
				logger.Info("Pausing for manual approval", "stepId", step.StepID, "stepExecId", step.StepExecID)
				_ = workflow.ExecuteActivity(ctx, a.UpdateStepStatus, step.StepExecID, "WAITING_APPROVAL", "").Get(ctx, nil)

				// 等待审批信号或超时
				var approval contract.StepApprovalSignal
				selector := workflow.NewSelector(ctx)

				selector.AddReceive(approveChannel, func(c workflow.ReceiveChannel, more bool) {
					c.Receive(ctx, &approval)
				})

				selector.AddReceive(cancelChannel, func(c workflow.ReceiveChannel, more bool) {
					c.Receive(ctx, &cancelMsg)
					approval.Approved = false
					approval.Comment = "Cancelled by user"
				})

				// 最大等待审批时间 (默认 24 小时)
				timeoutTimer := workflow.NewTimer(ctx, 24*time.Hour)
				timedOut := false
				selector.AddFuture(timeoutTimer, func(f workflow.Future) {
					timedOut = true
				})

				selector.Select(ctx)

				if timedOut {
					_ = workflow.ExecuteActivity(ctx, a.UpdateStepStatus, step.StepExecID, "FAILED", "Approval timed out").Get(ctx, nil)
					_ = workflow.ExecuteActivity(ctx, a.UpdatePipelineStatus, input.ExecID, "FAILED").Get(ctx, nil)
					return "TIMED_OUT", fmt.Errorf("step %s approval timed out", step.StepName)
				}

				if !approval.Approved {
					logger.Warn("Step rejected by approver", "stepId", step.StepID, "comment", approval.Comment)
					_ = workflow.ExecuteActivity(ctx, a.UpdateStepStatus, step.StepExecID, "FAILED", approval.Comment).Get(ctx, nil)
					_ = workflow.ExecuteActivity(ctx, a.UpdatePipelineStatus, input.ExecID, "FAILED").Get(ctx, nil)
					return "REJECTED", fmt.Errorf("step %s rejected: %s", step.StepName, approval.Comment)
				}

				logger.Info("Step approved successfully", "stepId", step.StepID)
				_ = workflow.ExecuteActivity(ctx, a.UpdateStepStatus, step.StepExecID, "SUCCESS", "").Get(ctx, nil)
				continue
			}

			// 普通步骤执行
			var stepResult string
			err := workflow.ExecuteActivity(ctx, a.ExecuteStep, step, input.Params).Get(ctx, &stepResult)
			if err != nil {
				logger.Error("Step execution failed", "stepId", step.StepID, "error", err)
				_ = workflow.ExecuteActivity(ctx, a.UpdateStepStatus, step.StepExecID, "FAILED", err.Error()).Get(ctx, nil)
				_ = workflow.ExecuteActivity(ctx, a.UpdatePipelineStatus, input.ExecID, "FAILED").Get(ctx, nil)
				return "FAILED", err
			}
		}
	}

	// 4. 所有阶段全部完成
	logger.Info("TitanPipelineWorkflow completed successfully", "execId", input.ExecID)
	_ = workflow.ExecuteActivity(ctx, a.UpdatePipelineStatus, input.ExecID, "SUCCESS").Get(ctx, nil)
	return "SUCCESS", nil
}
