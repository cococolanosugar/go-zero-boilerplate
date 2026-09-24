package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListClustersLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListClustersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListClustersLogic {
	return &ListClustersLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListClustersLogic) ListClusters(req *types.ListClustersReqVO) (resp *types.ListClustersRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.ListClusters(l.ctx, &titan.ListClustersReq{
		Env:      req.Env,
		Page:     req.Page,
		PageSize: req.PageSize,
	})
	if err != nil {
		return nil, err
	}

	list := make([]types.ClusterVO, 0, len(res.List))
	for _, item := range res.List {
		list = append(list, toClusterVO(item))
	}

	return &types.ListClustersRespVO{
		Total: res.Total,
		List:  list,
	}, nil
}
