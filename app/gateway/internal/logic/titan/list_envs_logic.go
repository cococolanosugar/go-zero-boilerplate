package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListEnvsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListEnvsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListEnvsLogic {
	return &ListEnvsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListEnvsLogic) ListEnvs(req *types.ListEnvsReqVO) (resp *types.ListEnvsRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.ListEnvs(l.ctx, &titan.ListEnvsReq{
		ProjectId: req.ProjectId,
	})
	if err != nil {
		return nil, err
	}

	list := make([]types.EnvVO, 0, len(res.List))
	for _, item := range res.List {
		list = append(list, toEnvVO(item))
	}

	return &types.ListEnvsRespVO{
		List: list,
	}, nil
}
