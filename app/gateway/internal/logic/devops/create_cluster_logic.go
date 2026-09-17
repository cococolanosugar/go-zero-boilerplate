package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateClusterLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateClusterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateClusterLogic {
	return &CreateClusterLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateClusterLogic) CreateCluster(req *types.CreateClusterReqVO) (resp *types.CreateClusterRespVO, err error) {
	userId := getUserIdFromCtx(l.ctx)
	res, err := l.svcCtx.DevopsRpc.CreateCluster(l.ctx, &devops.CreateClusterReq{
		Name:        req.Name,
		Env:         req.Env,
		ApiEndpoint: req.ApiEndpoint,
		Kubeconfig:  req.Kubeconfig,
		Description: req.Description,
		CreatedBy:   userId,
	})
	if err != nil {
		return nil, err
	}
	return &types.CreateClusterRespVO{
		Id: res.Id,
	}, nil
}
