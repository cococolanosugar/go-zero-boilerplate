package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

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

// ListExecutions 列表返回轻量列（runtime_params / artifacts JSON 由详情接口 GetExecutionDetail 返回）
func (l *ListExecutionsLogic) ListExecutions(in *titan.ListExecutionsReq) (*titan.ListExecutionsResp, error) {
	offset, limit := normalizePage(int64(in.Page), int64(in.PageSize))

	execs, total, err := l.svcCtx.PipelineExecModel.ListLightByPage(l.ctx, in.PipelineId, in.Status, offset, limit)
	if err != nil {
		return nil, xerr.NewErrMsg("查询执行记录列表失败: " + err.Error())
	}

	var list []*titan.ExecutionItem
	for _, e := range execs {
		list = append(list, &titan.ExecutionItem{
			Id:           e.Id,
			PipelineId:   e.PipelineId,
			PipelineName: e.PipelineName,
			ExecNo:       e.ExecNo,
			TriggerType:  e.TriggerType,
			TriggerBy:    e.TriggerBy,
			GitBranch:    e.GitBranch,
			GitCommit:    e.GitCommit,
			Status:       e.Status,
			WorkflowId:   e.WorkflowId,
			StartTime:    formatNullTime(e.StartTime),
			EndTime:      formatNullTime(e.EndTime),
			DurationMs:   e.DurationMs,
			CreateTime:   formatTime(e.CreateTime),
			UpdateTime:   formatTime(e.UpdateTime),
		})
	}

	return &titan.ListExecutionsResp{
		Total: total,
		List:  list,
	}, nil
}
