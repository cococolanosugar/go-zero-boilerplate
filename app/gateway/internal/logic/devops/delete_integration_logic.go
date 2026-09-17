package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteIntegrationLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteIntegrationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteIntegrationLogic {
	return &DeleteIntegrationLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteIntegrationLogic) DeleteIntegration(req *types.DeleteIntegrationReqVO) error {
	_, err := l.svcCtx.DevopsRpc.DeleteIntegration(l.ctx, &devops.DeleteIntegrationReq{
		Id: req.Id,
	})
	return err
}
