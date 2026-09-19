package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateEnvLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateEnvLogic {
	return &CreateEnvLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateEnvLogic) CreateEnv(req *types.CreateEnvReqVO) (resp *types.CreateEnvRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.CreateEnv(l.ctx, &titan.CreateEnvReq{
		ProjectId: req.ProjectId,
		EnvCode:   req.EnvCode,
		Name:      req.Name,
		ClusterId: req.ClusterId,
		Namespace: req.Namespace,
	})
	if err != nil {
		return nil, err
	}

	return &types.CreateEnvRespVO{
		Id: res.Id,
	}, nil
}
