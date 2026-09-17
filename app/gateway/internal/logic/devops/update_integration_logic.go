package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateIntegrationLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateIntegrationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateIntegrationLogic {
	return &UpdateIntegrationLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateIntegrationLogic) UpdateIntegration(req *types.UpdateIntegrationReqVO) error {
	_, err := l.svcCtx.DevopsRpc.UpdateIntegration(l.ctx, &devops.UpdateIntegrationReq{
		Id:          req.Id,
		Name:        req.Name,
		AuthType:    req.AuthType,
		Config:      req.Config,
		Status:      req.Status,
		Description: req.Description,
	})
	return err
}
