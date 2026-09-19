package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetAppLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetAppLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAppLogic {
	return &GetAppLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetAppLogic) GetApp(req *types.GetAppReqVO) (resp *types.AppVO, err error) {
	res, err := l.svcCtx.TitanRpc.GetApp(l.ctx, &titan.GetAppReq{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	vo := toAppVO(res.App)
	return &vo, nil
}
