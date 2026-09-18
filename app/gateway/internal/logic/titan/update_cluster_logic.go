package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
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
	_, err := l.svcCtx.TitanRpc.UpdateCluster(l.ctx, &titan.UpdateClusterReq{
		Id:          req.Id,
		Name:        req.Name,
		Env:         req.Env,
		ApiEndpoint: req.ApiEndpoint,
		Kubeconfig:  req.Kubeconfig,
		Description: req.Description,
	})
	return err
}
