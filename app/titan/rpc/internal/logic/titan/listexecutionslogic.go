package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListExecutionsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListExecutionsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListExecutionsLogic {
	return &ListExecutionsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListExecutionsLogic) ListExecutions(in *titan.ListExecutionsReq) (*titan.ListExecutionsResp, error) {
	page := in.Page
	if page <= 0 {
		page = 1
	}
	pageSize := in.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	where := "WHERE 1=1"
	var args []interface{}
	if in.PipelineId > 0 {
		where += " AND pipeline_id = ?"
		args = append(args, in.PipelineId)
	}
	if in.Status != "" {
		where += " AND status = ?"
		args = append(args, in.Status)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM titan_pipeline_exec %s", where)
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countQuery, args...); err != nil {
		return nil, err
	}

	var execs []*model.TitanPipelineExec
	listQuery := fmt.Sprintf("SELECT id, pipeline_id, pipeline_name, exec_no, trigger_type, trigger_by, git_branch, git_commit, runtime_params, status, workflow_id, start_time, end_time, duration_ms, artifacts, create_time, update_time FROM titan_pipeline_exec %s ORDER BY id DESC LIMIT %d, %d", where, offset, pageSize)
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &execs, listQuery, args...); err != nil {
		return nil, err
	}

	var list []*titan.ExecutionItem
	for _, e := range execs {
		startTimeStr := ""
		if e.StartTime.Valid && !e.StartTime.Time.IsZero() {
			startTimeStr = e.StartTime.Time.Format("2006-01-02 15:04:05")
		}
		endTimeStr := ""
		if e.EndTime.Valid && !e.EndTime.Time.IsZero() {
			endTimeStr = e.EndTime.Time.Format("2006-01-02 15:04:05")
		}

		list = append(list, &titan.ExecutionItem{
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
		})
	}

	return &titan.ListExecutionsResp{
		Total: total,
		List:  list,
	}, nil
}
