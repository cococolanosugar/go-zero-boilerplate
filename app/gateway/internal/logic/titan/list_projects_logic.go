package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListProjectsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListProjectsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListProjectsLogic {
	return &ListProjectsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListProjectsLogic) ListProjects(req *types.ListProjectsReqVO) (resp *types.ListProjectsRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.ListProjects(l.ctx, &titan.ListProjectsReq{
		Page:     req.Page,
		PageSize: req.PageSize,
		Keyword:  req.Keyword,
	})
	if err != nil {
		return nil, err
	}

	list := make([]types.ProjectVO, 0, len(res.List))
	for _, item := range res.List {
		list = append(list, toProjectVO(item))
	}

	return &types.ListProjectsRespVO{
		Total: res.Total,
		List:  list,
	}, nil
}
