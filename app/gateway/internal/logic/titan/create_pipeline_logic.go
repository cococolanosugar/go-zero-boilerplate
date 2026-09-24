package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreatePipelineLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreatePipelineLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreatePipelineLogic {
	return &CreatePipelineLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreatePipelineLogic) CreatePipeline(req *types.CreatePipelineReqVO) (resp *types.CreatePipelineRespVO, err error) {
	userId := getUserIdFromCtx(l.ctx)
	res, err := l.svcCtx.TitanRpc.CreatePipeline(l.ctx, &titan.CreatePipelineReq{
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Category:    req.Category,
		GitRepo:     req.GitRepo,
		GitBranch:   req.GitBranch,
		Stages:      req.Stages,
		Params:      req.Params,
		Triggers:    req.Triggers,
		Description: req.Description,
		CreatedBy:   userId,
	})
	if err != nil {
		return nil, err
	}
	return &types.CreatePipelineRespVO{
		Id: res.Id,
	}, nil
}
