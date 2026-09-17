package devopslogic

import (
	"context"
	"fmt"
	"time"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/devops/rpc/internal/svc"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetStepLogLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetStepLogLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetStepLogLogic {
	return &GetStepLogLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetStepLogLogic) GetStepLog(in *devops.GetStepLogReq) (*devops.GetStepLogResp, error) {
	step, err := l.svcCtx.PipelineStepExecModel.FindOne(l.ctx, in.StepExecId)
	if err != nil {
		return nil, xerr.NewErrMsg("步骤执行记录不存在")
	}

	timeStr := time.Now().Format("15:04:05")
	if step.StartTime.Valid && !step.StartTime.Time.IsZero() {
		timeStr = step.StartTime.Time.Format("15:04:05")
	}

	sampleLog := fmt.Sprintf("[%s] [INFO] Starting step %s (%s)...\n[%s] [INFO] Step completed with status %s.\n",
		timeStr, step.StepName, step.StepType, timeStr, step.Status)

	if in.Offset >= int64(len(sampleLog)) {
		return &devops.GetStepLogResp{
			Content:    "",
			NextOffset: in.Offset,
			IsEnd:      step.Status == "SUCCESS" || step.Status == "FAILED" || step.Status == "SKIPPED",
		}, nil
	}

	content := sampleLog[in.Offset:]
	return &devops.GetStepLogResp{
		Content:    content,
		NextOffset: int64(len(sampleLog)),
		IsEnd:      step.Status == "SUCCESS" || step.Status == "FAILED" || step.Status == "SKIPPED",
	}, nil
}
