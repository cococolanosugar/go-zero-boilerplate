package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
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
	res, err := l.svcCtx.TitanRpc.ListNamespaces(l.ctx, &titan.ListNamespacesReq{
		ClusterId: req.Id,
	})
	if err != nil {
		return nil, err
	}
	return &types.ListNamespacesRespVO{
		Namespaces: res.Namespaces,
	}, nil
}
