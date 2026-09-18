package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
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

func (l *GetExecutionDetailLogic) GetExecutionDetail(in *titan.GetExecutionDetailReq) (*titan.ExecutionDetailResp, error) {
	e, err := l.svcCtx.PipelineExecModel.FindOne(l.ctx, in.ExecId)
	if err != nil {
		return nil, xerr.NewErrMsg("执行记录不存在")
	}

	startTimeStr := ""
	if e.StartTime.Valid && !e.StartTime.Time.IsZero() {
		startTimeStr = e.StartTime.Time.Format("2006-01-02 15:04:05")
	}
	endTimeStr := ""
	if e.EndTime.Valid && !e.EndTime.Time.IsZero() {
		endTimeStr = e.EndTime.Time.Format("2006-01-02 15:04:05")
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
		StartTime:     startTimeStr,
		EndTime:       endTimeStr,
		DurationMs:    e.DurationMs,
		Artifacts:     e.Artifacts,
		CreateTime:    e.CreateTime.Format("2006-01-02 15:04:05"),
	}

	var stepExecs []*model.TitanPipelineStepExec
	query := fmt.Sprintf("SELECT id, exec_id, stage_id, step_id, step_name, step_type, status, log_path, error_msg, start_time, end_time, duration_ms, create_time FROM titan_pipeline_step_exec WHERE exec_id = ? ORDER BY id ASC")
	_ = l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &stepExecs, query, in.ExecId)

	var stepList []*titan.StepExecItem
	for _, s := range stepExecs {
		sStart := ""
		if s.StartTime.Valid && !s.StartTime.Time.IsZero() {
			sStart = s.StartTime.Time.Format("2006-01-02 15:04:05")
		}
		sEnd := ""
		if s.EndTime.Valid && !s.EndTime.Time.IsZero() {
			sEnd = s.EndTime.Time.Format("2006-01-02 15:04:05")
		}

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
			StartTime:  sStart,
			EndTime:    sEnd,
			DurationMs: s.DurationMs,
		})
	}

	return &titan.ExecutionDetailResp{
		Execution: execItem,
		Steps:     stepList,
	}, nil
}
