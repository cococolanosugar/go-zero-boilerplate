package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type TestIntegrationLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewTestIntegrationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TestIntegrationLogic {
	return &TestIntegrationLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *TestIntegrationLogic) TestIntegration(req *types.TestIntegrationReqVO) (resp *types.TestIntegrationRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.TestIntegration(l.ctx, &titan.TestIntegrationReq{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}
	return &types.TestIntegrationRespVO{
		Success: res.Success,
		Message: res.Message,
	}, nil
}
