package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateEnvLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateEnvLogic {
	return &UpdateEnvLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateEnvLogic) UpdateEnv(req *types.UpdateEnvReqVO) error {
	_, err := l.svcCtx.TitanRpc.UpdateEnv(l.ctx, &titan.UpdateEnvReq{
		Id:        req.Id,
		Name:      req.Name,
		ClusterId: req.ClusterId,
		Namespace: req.Namespace,
		Status:    req.Status,
	})
	return err
}
