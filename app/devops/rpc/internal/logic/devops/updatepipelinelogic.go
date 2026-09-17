package devopslogic

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/devops/rpc/internal/svc"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdatePipelineLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdatePipelineLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdatePipelineLogic {
	return &UpdatePipelineLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdatePipelineLogic) UpdatePipeline(in *devops.UpdatePipelineReq) (*devops.CommonResp, error) {
	p, err := l.svcCtx.PipelineModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrMsg("流水线不存在")
	}

	if in.DisplayName != "" {
		p.DisplayName = in.DisplayName
	}
	if in.Category != "" {
		p.Category = in.Category
	}
	if in.GitRepo != "" {
		p.GitRepo = in.GitRepo
	}
	if in.GitBranch != "" {
		p.GitBranch = in.GitBranch
	}
	if in.Stages != "" {
		p.Stages = in.Stages
	}
	if in.Params != "" {
		p.Params = in.Params
	}
	if in.Triggers != "" {
		p.Triggers = in.Triggers
	}
	p.Status = int64(in.Status)
	p.Description = in.Description

	if err := l.svcCtx.PipelineModel.Update(l.ctx, p); err != nil {
		return nil, xerr.NewErrMsg("更新流水线失败: " + err.Error())
	}

	return &devops.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
