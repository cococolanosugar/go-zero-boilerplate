package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListArtifactsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListArtifactsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListArtifactsLogic {
	return &ListArtifactsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListArtifactsLogic) ListArtifacts(req *types.ListArtifactsReqVO) (resp *types.ListArtifactsRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.ListArtifacts(l.ctx, &titan.ListArtifactsReq{
		ProjectId: req.ProjectId,
		AppId:     req.AppId,
		Page:      req.Page,
		PageSize:  req.PageSize,
	})
	if err != nil {
		return nil, err
	}

	list := make([]types.ArtifactVO, 0, len(res.List))
	for _, item := range res.List {
		list = append(list, toArtifactVO(item))
	}

	return &types.ListArtifactsRespVO{
		Total: res.Total,
		List:  list,
	}, nil
}
