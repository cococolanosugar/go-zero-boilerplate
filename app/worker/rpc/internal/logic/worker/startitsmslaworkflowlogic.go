package workerlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/worker/contract"
	"go-zero-boilerplate/app/worker/rpc/internal/svc"
	"go-zero-boilerplate/app/worker/rpc/internal/workflows"
	"go-zero-boilerplate/app/worker/rpc/pb"

	"github.com/zeromicro/go-zero/core/logx"
	"go.temporal.io/sdk/client"
)

type StartItsmSlaWorkflowLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewStartItsmSlaWorkflowLogic(ctx context.Context, svcCtx *svc.ServiceContext) *StartItsmSlaWorkflowLogic {
	return &StartItsmSlaWorkflowLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// ITSM SLA 分布式工作流调度
func (l *StartItsmSlaWorkflowLogic) StartItsmSlaWorkflow(in *pb.StartItsmSlaWorkflowReq) (*pb.StartItsmSlaWorkflowResp, error) {
	if l.svcCtx.TemporalClient == nil {
		l.Logger.Errorf("TemporalClient is not initialized, skipping SLA workflow for ticket %d", in.TicketId)
		return &pb.StartItsmSlaWorkflowResp{
			Success: false,
			Message: "Temporal client not connected",
		}, nil
	}

	workflowID := fmt.Sprintf("itsm-sla-%s-%d", in.TicketNo, in.TicketId)
	taskQueue := l.svcCtx.Config.Temporal.TaskQueue
	if taskQueue == "" {
		taskQueue = "ASYNC_TASK_QUEUE"
	}

	workflowOptions := client.StartWorkflowOptions{
		ID:        workflowID,
		TaskQueue: taskQueue,
	}

	input := contract.ItsmSlaInput{
		TicketId:            in.TicketId,
		TicketNo:            in.TicketNo,
		ResponseDurationSec: int(in.ResponseDurationSec),
		ResolveDurationSec:  int(in.ResolveDurationSec),
	}

	we, err := l.svcCtx.TemporalClient.ExecuteWorkflow(l.ctx, workflowOptions, workflows.ItsmSlaMonitorWorkflow, input)
	if err != nil {
		l.Logger.Errorf("Failed to start ItsmSlaMonitorWorkflow for ticket %d: %v", in.TicketId, err)
		return &pb.StartItsmSlaWorkflowResp{
			Success: false,
			Message: err.Error(),
		}, nil
	}

	l.Logger.Infof("Successfully started ItsmSlaMonitorWorkflow [ID: %s, RunID: %s] for ticket %s", we.GetID(), we.GetRunID(), in.TicketNo)
	return &pb.StartItsmSlaWorkflowResp{
		Success:    true,
		WorkflowId: we.GetID(),
		RunId:      we.GetRunID(),
		Message:    "SUCCESS",
	}, nil
}
