package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetEnvLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetEnvLogic {
	return &GetEnvLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetEnvLogic) GetEnv(req *types.GetEnvReqVO) (resp *types.EnvVO, err error) {
	res, err := l.svcCtx.TitanRpc.GetEnv(l.ctx, &titan.GetEnvReq{
		Id:        req.Id,
		ProjectId: req.ProjectId,
	})
	if err != nil {
		return nil, err
	}

	vo := toEnvVO(res.Env)
	return &vo, nil
}
