package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListPipelinesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListPipelinesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListPipelinesLogic {
	return &ListPipelinesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListPipelinesLogic) ListPipelines(req *types.ListPipelinesReqVO) (resp *types.ListPipelinesRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.ListPipelines(l.ctx, &titan.ListPipelinesReq{
		Category: req.Category,
		Keyword:  req.Keyword,
		Page:     req.Page,
		PageSize: req.PageSize,
	})
	if err != nil {
		return nil, err
	}

	list := make([]types.PipelineVO, 0, len(res.List))
	for _, item := range res.List {
		list = append(list, toPipelineVO(item))
	}

	return &types.ListPipelinesRespVO{
		Total: res.Total,
		List:  list,
	}, nil
}
