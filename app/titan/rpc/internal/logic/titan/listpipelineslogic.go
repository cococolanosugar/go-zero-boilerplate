package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListPipelinesLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListPipelinesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListPipelinesLogic {
	return &ListPipelinesLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListPipelinesLogic) ListPipelines(in *titan.ListPipelinesReq) (*titan.ListPipelinesResp, error) {
	offset, limit := normalizePage(int64(in.Page), int64(in.PageSize))
	keyword := escapeLike(in.Keyword)

	pipelines, total, err := l.svcCtx.PipelineModel.ListByPage(l.ctx, in.Category, keyword, offset, limit)
	if err != nil {
		return nil, xerr.NewErrMsg("查询流水线列表失败: " + err.Error())
	}

	var list []*titan.PipelineItem
	for _, p := range pipelines {
		list = append(list, &titan.PipelineItem{
			Id:          p.Id,
			Name:        p.Name,
			DisplayName: p.DisplayName,
			Category:    p.Category,
			GitRepo:     p.GitRepo,
			GitBranch:   p.GitBranch,
			Stages:      p.Stages,
			Params:      p.Params,
			Triggers:    p.Triggers,
			Status:      int32(p.Status),
			Description: p.Description,
			CreatedBy:   p.CreatedBy,
			CreateTime:  formatTime(p.CreateTime),
			UpdateTime:  formatTime(p.UpdateTime),
		})
	}

	return &titan.ListPipelinesResp{
		Total: total,
		List:  list,
	}, nil
}
