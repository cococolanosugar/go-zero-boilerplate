package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateIntegrationLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateIntegrationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateIntegrationLogic {
	return &CreateIntegrationLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateIntegrationLogic) CreateIntegration(req *types.CreateIntegrationReqVO) (resp *types.CreateIntegrationRespVO, err error) {
	userId := getUserIdFromCtx(l.ctx)
	res, err := l.svcCtx.DevopsRpc.CreateIntegration(l.ctx, &devops.CreateIntegrationReq{
		Name:        req.Name,
		Category:    req.Category,
		AuthType:    req.AuthType,
		Config:      req.Config,
		Description: req.Description,
		CreatedBy:   userId,
	})
	if err != nil {
		return nil, err
	}
	return &types.CreateIntegrationRespVO{
		Id: res.Id,
	}, nil
}
