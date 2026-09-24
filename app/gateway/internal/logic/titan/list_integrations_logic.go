package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListIntegrationsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListIntegrationsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListIntegrationsLogic {
	return &ListIntegrationsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListIntegrationsLogic) ListIntegrations(req *types.ListIntegrationsReqVO) (resp *types.ListIntegrationsRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.ListIntegrations(l.ctx, &titan.ListIntegrationsReq{
		Category: req.Category,
		Page:     req.Page,
		PageSize: req.PageSize,
	})
	if err != nil {
		return nil, err
	}

	list := make([]types.IntegrationVO, 0, len(res.List))
	for _, item := range res.List {
		list = append(list, toIntegrationVO(item))
	}

	return &types.ListIntegrationsRespVO{
		Total: res.Total,
		List:  list,
	}, nil
}
