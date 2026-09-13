package workerlogic

import (
	"context"

	"go-zero-boilerplate/app/worker/contract"
	"go-zero-boilerplate/app/worker/rpc/internal/svc"
	"go-zero-boilerplate/app/worker/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetWorkflowDetailLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetWorkflowDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetWorkflowDetailLogic {
	return &GetWorkflowDetailLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetWorkflowDetailLogic) GetWorkflowDetail(in *pb.GetWorkflowDetailReq) (*pb.GetWorkflowDetailResp, error) {
	if l.svcCtx.TemporalClient == nil {
		return nil, xerr.NewCodeError(xerr.ServerCommonError, "Temporal client is not initialized")
	}

	if in.WorkflowId == "" {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	desc, err := l.svcCtx.TemporalClient.DescribeWorkflowExecution(l.ctx, in.WorkflowId, in.RunId)
	if err != nil {
		l.Errorf("DescribeWorkflowExecution failed for %s: %v", in.WorkflowId, err)
		return nil, xerr.NewCodeError(xerr.RecordNotFound, "Temporal workflow not found: "+err.Error())
	}

	info := desc.WorkflowExecutionInfo
	statusStr := info.GetStatus().String()

	resp := &pb.GetWorkflowDetailResp{
		WorkflowId: info.Execution.WorkflowId,
		RunId:      info.Execution.RunId,
		Status:     statusStr,
		State:      statusStr,
	}

	if info.GetStartTime() != nil {
		resp.StartTime = info.GetStartTime().AsTime().Unix()
	}
	if info.GetCloseTime() != nil {
		resp.CloseTime = info.GetCloseTime().AsTime().Unix()
	}

	// Try querying in-memory workflow state via QueryHandler
	queryResp, queryErr := l.svcCtx.TemporalClient.QueryWorkflow(l.ctx, in.WorkflowId, in.RunId, contract.QueryGetTaskStatus)
	if queryErr == nil {
		var state string
		if err := queryResp.Get(&state); err == nil && state != "" {
			resp.State = state
		}
	}

	return resp, nil
}
