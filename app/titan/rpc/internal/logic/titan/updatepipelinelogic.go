package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
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

// UpdatePipeline 采用"字段显式提供才更新"语义：proto optional 指针为 nil 表示不更新。
func (l *UpdatePipelineLogic) UpdatePipeline(in *titan.UpdatePipelineReq) (*titan.CommonResp, error) {
	p, err := l.svcCtx.PipelineModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "流水线")
	}

	if in.DisplayName != nil {
		p.DisplayName = *in.DisplayName
	}
	if in.Category != nil {
		p.Category = *in.Category
	}
	if in.GitRepo != nil {
		p.GitRepo = *in.GitRepo
	}
	if in.GitBranch != nil {
		p.GitBranch = *in.GitBranch
	}
	if in.Stages != nil {
		p.Stages = *in.Stages
	}
	if in.Params != nil {
		p.Params = *in.Params
	}
	if in.Triggers != nil {
		p.Triggers = *in.Triggers
	}
	if in.Status != nil {
		p.Status = int64(*in.Status)
	}
	if in.Description != nil {
		p.Description = *in.Description
	}

	if err := l.svcCtx.PipelineModel.Update(l.ctx, p); err != nil {
		return nil, xerr.NewErrMsg("更新流水线失败: " + err.Error())
	}

	return &titan.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
