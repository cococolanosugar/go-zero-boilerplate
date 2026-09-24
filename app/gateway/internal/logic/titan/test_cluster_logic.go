package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type TestClusterLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewTestClusterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TestClusterLogic {
	return &TestClusterLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *TestClusterLogic) TestCluster(req *types.TestClusterReqVO) (resp *types.TestClusterRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.TestCluster(l.ctx, &titan.TestClusterReq{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}
	return &types.TestClusterRespVO{
		Success: res.Success,
		Version: res.Version,
		Message: res.Message,
	}, nil
}
