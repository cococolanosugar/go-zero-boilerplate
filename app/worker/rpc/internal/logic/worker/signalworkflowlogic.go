package workerlogic

import (
	"context"

	"go-zero-boilerplate/app/worker/rpc/internal/svc"
	"go-zero-boilerplate/app/worker/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type SignalWorkflowLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewSignalWorkflowLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SignalWorkflowLogic {
	return &SignalWorkflowLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *SignalWorkflowLogic) SignalWorkflow(in *pb.SignalWorkflowReq) (*pb.SignalWorkflowResp, error) {
	if l.svcCtx.TemporalClient == nil {
		return nil, xerr.NewCodeError(xerr.ServerCommonError, "Temporal client is not initialized")
	}

	if in.WorkflowId == "" || in.SignalName == "" {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	err := l.svcCtx.TemporalClient.SignalWorkflow(l.ctx, in.WorkflowId, in.RunId, in.SignalName, in.Payload)
	if err != nil {
		l.Errorf("Failed to send signal %s to workflow %s: %v", in.SignalName, in.WorkflowId, err)
		return nil, xerr.NewCodeError(xerr.ServerCommonError, "Failed to send signal to Temporal: "+err.Error())
	}

	l.Infof("Signal %s sent to workflow %s successfully", in.SignalName, in.WorkflowId)

	return &pb.SignalWorkflowResp{
		Success: true,
		Message: "Signal sent successfully",
	}, nil
}
