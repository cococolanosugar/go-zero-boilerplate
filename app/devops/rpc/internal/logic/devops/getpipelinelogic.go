package devopslogic

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/devops/rpc/internal/svc"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetPipelineLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetPipelineLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetPipelineLogic {
	return &GetPipelineLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetPipelineLogic) GetPipeline(in *devops.GetPipelineReq) (*devops.PipelineDetailResp, error) {
	p, err := l.svcCtx.PipelineModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrMsg("流水线不存在")
	}

	return &devops.PipelineDetailResp{
		Pipeline: &devops.PipelineItem{
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
		},
	}, nil
}
