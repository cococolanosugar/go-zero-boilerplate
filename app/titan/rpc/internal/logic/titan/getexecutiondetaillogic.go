package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetExecutionDetailLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetExecutionDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetExecutionDetailLogic {
	return &GetExecutionDetailLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// GetExecutionDetail 执行详情：含 runtime_params / artifacts / 全部步骤（详情接口返回完整字段）
func (l *GetExecutionDetailLogic) GetExecutionDetail(in *titan.GetExecutionDetailReq) (*titan.ExecutionDetailResp, error) {
	e, err := l.svcCtx.PipelineExecModel.FindOne(l.ctx, in.ExecId)
	if err != nil {
		return nil, notFoundOrError(err, "执行记录")
	}

	execItem := &titan.ExecutionItem{
		Id:            e.Id,
		PipelineId:    e.PipelineId,
		PipelineName:  e.PipelineName,
		ExecNo:        e.ExecNo,
		TriggerType:   e.TriggerType,
		TriggerBy:     e.TriggerBy,
		GitBranch:     e.GitBranch,
		GitCommit:     e.GitCommit,
		RuntimeParams: e.RuntimeParams,
		Status:        e.Status,
		WorkflowId:    e.WorkflowId,
		StartTime:     formatNullTime(e.StartTime),
		EndTime:       formatNullTime(e.EndTime),
		DurationMs:    e.DurationMs,
		Artifacts:     e.Artifacts,
		CreateTime:    formatTime(e.CreateTime),
		UpdateTime:    formatTime(e.UpdateTime),
	}

	stepExecs, err := l.svcCtx.PipelineStepExecModel.ListByExecId(l.ctx, in.ExecId)
	if err != nil {
		return nil, xerr.NewErrMsg("查询执行步骤失败: " + err.Error())
	}

	var stepList []*titan.StepExecItem
	for _, s := range stepExecs {
		stepList = append(stepList, &titan.StepExecItem{
			Id:         s.Id,
			ExecId:     s.ExecId,
			StageId:    s.StageId,
			StepId:     s.StepId,
			StepName:   s.StepName,
			StepType:   s.StepType,
			Status:     s.Status,
			LogPath:    s.LogPath,
			ErrorMsg:   s.ErrorMsg,
			StartTime:  formatNullTime(s.StartTime),
			EndTime:    formatNullTime(s.EndTime),
			DurationMs: s.DurationMs,
		})
	}

	return &titan.ExecutionDetailResp{
		Execution: execItem,
		Steps:     stepList,
	}, nil
}
