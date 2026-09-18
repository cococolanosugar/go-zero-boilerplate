package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"

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
	if in.Category != "" {
		where += " AND category = ?"
		args = append(args, in.Category)
	}
	if in.Keyword != "" {
		where += " AND (name LIKE ? OR display_name LIKE ?)"
		pattern := "%" + in.Keyword + "%"
		args = append(args, pattern, pattern)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM titan_pipeline %s", where)
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countQuery, args...); err != nil {
		return nil, err
	}

	var pipelines []*model.TitanPipeline
	listQuery := fmt.Sprintf("SELECT id, name, display_name, category, git_repo, git_branch, stages, params, triggers, status, description, created_by, create_time, update_time FROM titan_pipeline %s ORDER BY id DESC LIMIT %d, %d", where, offset, pageSize)
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &pipelines, listQuery, args...); err != nil {
		return nil, err
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
			CreateTime:  p.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:  p.UpdateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &titan.ListPipelinesResp{
		Total: total,
		List:  list,
	}, nil
}
