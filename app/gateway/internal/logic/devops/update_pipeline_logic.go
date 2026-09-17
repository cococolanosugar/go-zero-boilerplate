package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdatePipelineLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdatePipelineLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdatePipelineLogic {
	return &UpdatePipelineLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdatePipelineLogic) UpdatePipeline(req *types.UpdatePipelineReqVO) error {
	_, err := l.svcCtx.DevopsRpc.UpdatePipeline(l.ctx, &devops.UpdatePipelineReq{
		Id:          req.Id,
		DisplayName: req.DisplayName,
		Category:    req.Category,
		GitRepo:     req.GitRepo,
		GitBranch:   req.GitBranch,
		Stages:      req.Stages,
		Params:      req.Params,
		Triggers:    req.Triggers,
		Status:      req.Status,
		Description: req.Description,
	})
	return err
}
