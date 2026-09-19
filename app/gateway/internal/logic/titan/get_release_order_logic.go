package titan

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetReleaseOrderLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetReleaseOrderLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetReleaseOrderLogic {
	return &GetReleaseOrderLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetReleaseOrderLogic) GetReleaseOrder(req *types.GetReleaseOrderReqVO) (resp *types.ReleaseOrderDetailRespVO, err error) {
	rpcResp, err := l.svcCtx.TitanRpc.GetReleaseOrder(l.ctx, &titan.GetReleaseOrderReq{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.ReleaseOrderDetailRespVO{
		Order:      toReleaseOrderVO(rpcResp.Order),
		ItsmStatus: rpcResp.ItsmStatus,
	}, nil
}
