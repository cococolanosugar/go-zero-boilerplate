package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateClusterLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateClusterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateClusterLogic {
	return &UpdateClusterLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateClusterLogic) UpdateCluster(req *types.UpdateClusterReqVO) error {
	_, err := l.svcCtx.DevopsRpc.UpdateCluster(l.ctx, &devops.UpdateClusterReq{
		Id:          req.Id,
		Name:        req.Name,
		Env:         req.Env,
		ApiEndpoint: req.ApiEndpoint,
		Kubeconfig:  req.Kubeconfig,
		Description: req.Description,
	})
	return err
}
