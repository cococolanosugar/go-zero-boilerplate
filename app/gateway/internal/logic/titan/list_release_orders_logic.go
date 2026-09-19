package titan

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListReleaseOrdersLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListReleaseOrdersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListReleaseOrdersLogic {
	return &ListReleaseOrdersLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListReleaseOrdersLogic) ListReleaseOrders(req *types.ListReleaseOrdersReqVO) (resp *types.ListReleaseOrdersRespVO, err error) {
	rpcResp, err := l.svcCtx.TitanRpc.ListReleaseOrders(l.ctx, &titan.ListReleaseOrdersReq{
		ProjectId: req.ProjectId,
		TargetEnv: req.TargetEnv,
		Status:    req.Status,
		Keyword:   req.Keyword,
		Page:      req.Page,
		PageSize:  req.PageSize,
	})
	if err != nil {
		return nil, err
	}

	list := make([]types.ReleaseOrderVO, 0, len(rpcResp.List))
	for _, item := range rpcResp.List {
		list = append(list, toReleaseOrderVO(item))
	}

	return &types.ListReleaseOrdersRespVO{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
