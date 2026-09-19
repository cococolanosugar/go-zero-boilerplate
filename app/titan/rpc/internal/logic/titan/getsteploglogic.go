package titanlogic

import (
	"context"
	"fmt"
	"time"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

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

// GetStepLog 返回步骤日志分片。IsEnd 覆盖全部终态：终态后前端轮询即停止，
// 进行中的步骤明确返回 isEnd=false 供前端继续拉取。
// 注意：当前步骤日志内容为运行时摘要（真实执行引擎与日志文件读取属批次 4 范畴）。
func (l *GetStepLogLogic) GetStepLog(in *titan.GetStepLogReq) (*titan.GetStepLogResp, error) {
	step, err := l.svcCtx.PipelineStepExecModel.FindOne(l.ctx, in.StepExecId)
	if err != nil {
		return nil, notFoundOrError(err, "步骤执行记录")
	}

	if model.IsStepTerminal(step.Status) {
		return &titan.GetStepLogResp{
			Content:    "",
			NextOffset: in.Offset,
			IsEnd:      true,
		}, nil
	}

	// 进行中步骤：返回运行摘要片段，isEnd=false 维持轮询
	timeStr := time.Now().Format("15:04:05")
	if step.StartTime.Valid && !step.StartTime.Time.IsZero() {
		timeStr = step.StartTime.Time.Format("15:04:05")
	}
	sampleLog := fmt.Sprintf("[demo] [%s] 步骤 %s (%s) 运行中, 状态: %s\n(真实日志流将在流水线执行引擎接入后提供)\n",
		timeStr, step.StepName, step.StepType, step.Status)

	if in.Offset >= int64(len(sampleLog)) {
		return &titan.GetStepLogResp{
			Content:    "",
			NextOffset: in.Offset,
			IsEnd:      false,
		}, nil
	}

	return &titan.GetStepLogResp{
		Content:    sampleLog[in.Offset:],
		NextOffset: int64(len(sampleLog)),
		IsEnd:      false,
	}, nil
}
