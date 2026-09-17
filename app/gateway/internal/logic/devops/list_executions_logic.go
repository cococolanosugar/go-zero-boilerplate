package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListExecutionsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListExecutionsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListExecutionsLogic {
	return &ListExecutionsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListExecutionsLogic) ListExecutions(req *types.ListExecutionsReqVO) (resp *types.ListExecutionsRespVO, err error) {
	res, err := l.svcCtx.DevopsRpc.ListExecutions(l.ctx, &devops.ListExecutionsReq{
		PipelineId: req.PipelineId,
		Status:     req.Status,
		Page:       req.Page,
		PageSize:   req.PageSize,
	})
	if err != nil {
		return nil, err
	}

	list := make([]types.ExecutionVO, 0, len(res.List))
	for _, item := range res.List {
		list = append(list, toExecutionVO(item))
	}

	return &types.ListExecutionsRespVO{
		Total: res.Total,
		List:  list,
	}, nil
}
