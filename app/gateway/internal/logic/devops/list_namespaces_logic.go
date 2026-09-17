package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListNamespacesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListNamespacesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListNamespacesLogic {
	return &ListNamespacesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListNamespacesLogic) ListNamespaces(req *types.ListNamespacesReqVO) (resp *types.ListNamespacesRespVO, err error) {
	res, err := l.svcCtx.DevopsRpc.ListNamespaces(l.ctx, &devops.ListNamespacesReq{
		ClusterId: req.Id,
	})
	if err != nil {
		return nil, err
	}
	return &types.ListNamespacesRespVO{
		Namespaces: res.Namespaces,
	}, nil
}
