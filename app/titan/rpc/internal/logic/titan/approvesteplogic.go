package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ApproveStepLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewApproveStepLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ApproveStepLogic {
	return &ApproveStepLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ApproveStepLogic) ApproveStep(in *titan.ApproveStepReq) (*titan.CommonResp, error) {
	step, err := l.svcCtx.PipelineStepExecModel.FindOne(l.ctx, in.StepExecId)
	if err != nil {
		return nil, notFoundOrError(err, "步骤执行记录")
	}

	if step.Status != "WAITING_APPROVAL" {
		return nil, xerr.NewErrMsg("当前步骤不在等待审批状态")
	}

	if in.Approved {
		step.Status = model.ExecStatusSuccess
		step.ErrorMsg = in.Comment
	} else {
		step.Status = model.ExecStatusFailed
		step.ErrorMsg = "审批驳回: " + in.Comment
	}

	if err := l.svcCtx.PipelineStepExecModel.Update(l.ctx, step); err != nil {
		return nil, xerr.NewErrMsg("更新步骤状态失败: " + err.Error())
	}

	return &titan.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
