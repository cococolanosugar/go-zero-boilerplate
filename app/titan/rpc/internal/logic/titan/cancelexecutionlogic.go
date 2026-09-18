package titanlogic

import (
	"context"
	"database/sql"
	"time"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
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

func (l *CancelExecutionLogic) CancelExecution(in *titan.CancelExecutionReq) (*titan.CommonResp, error) {
	exec, err := l.svcCtx.PipelineExecModel.FindOne(l.ctx, in.ExecId)
	if err != nil {
		return nil, xerr.NewErrMsg("执行记录不存在")
	}

	if exec.Status == "SUCCESS" || exec.Status == "FAILED" || exec.Status == "ABORTED" {
		return nil, xerr.NewErrMsg("当前执行已处于终止状态，无需取消")
	}

	exec.Status = "ABORTED"
	exec.EndTime = sql.NullTime{Time: time.Now(), Valid: true}
	if err := l.svcCtx.PipelineExecModel.Update(l.ctx, exec); err != nil {
		return nil, xerr.NewErrMsg("取消流水线失败: " + err.Error())
	}

	return &titan.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
