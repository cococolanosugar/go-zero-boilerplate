package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CancelExecutionLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCancelExecutionLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CancelExecutionLogic {
	return &CancelExecutionLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// CancelExecution 以带前置状态条件的原子更新取消执行：
// 仅当执行仍处于可取消状态时取消生效，并发取消与状态推进互不覆盖终态。
func (l *CancelExecutionLogic) CancelExecution(in *titan.CancelExecutionReq) (*titan.CommonResp, error) {
	exec, err := l.svcCtx.PipelineExecModel.FindOne(l.ctx, in.ExecId)
	if err != nil {
		return nil, notFoundOrError(err, "执行记录")
	}
	if model.IsExecTerminal(exec.Status) {
		return nil, xerr.NewErrMsg("当前执行已处于终止状态，无需取消")
	}

	// 原子条件更新：仅在仍为可取消状态时迁移为 ABORTED，影响行数 0 即表示并发方已先行推进
	updated, err := l.svcCtx.PipelineExecModel.FinishWithStatus(l.ctx, in.ExecId,
		[]string{model.ExecStatusPending, model.ExecStatusRunning}, model.ExecStatusAborted)
	if err != nil {
		return nil, xerr.NewErrMsg("取消流水线失败: " + err.Error())
	}
	if !updated {
		return nil, xerr.NewErrMsg("执行状态已变化，取消未生效")
	}

	return &titan.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
