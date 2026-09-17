package devopslogic

import (
	"context"

	"go-zero-boilerplate/app/devops/model"
	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/devops/rpc/internal/svc"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreatePipelineLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreatePipelineLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreatePipelineLogic {
	return &CreatePipelineLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreatePipelineLogic) CreatePipeline(in *devops.CreatePipelineReq) (*devops.CreatePipelineResp, error) {
	if in.Name == "" || in.Stages == "" {
		return nil, xerr.NewErrMsg("流水线名称与阶段编排不能为空")
	}

	res, err := l.svcCtx.PipelineModel.Insert(l.ctx, &model.DevopsPipeline{
		Name:        in.Name,
		DisplayName: in.DisplayName,
		Category:    in.Category,
		GitRepo:     in.GitRepo,
		GitBranch:   in.GitBranch,
		Stages:      in.Stages,
		Params:      in.Params,
		Triggers:    in.Triggers,
		Status:      1,
		Description: in.Description,
		CreatedBy:   in.CreatedBy,
	})
	if err != nil {
		return nil, xerr.NewErrMsg("创建流水线失败: " + err.Error())
	}

	id, _ := res.LastInsertId()
	return &devops.CreatePipelineResp{Id: id}, nil
}
