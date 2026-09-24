package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListAppsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListAppsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListAppsLogic {
	return &ListAppsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListAppsLogic) ListApps(req *types.ListAppsReqVO) (resp *types.ListAppsRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.ListApps(l.ctx, &titan.ListAppsReq{
		ProjectId: req.ProjectId,
		Page:      req.Page,
		PageSize:  req.PageSize,
	})
	if err != nil {
		return nil, err
	}

	list := make([]types.AppVO, 0, len(res.List))
	for _, item := range res.List {
		list = append(list, toAppVO(item))
	}

	return &types.ListAppsRespVO{
		Total: res.Total,
		List:  list,
	}, nil
}
