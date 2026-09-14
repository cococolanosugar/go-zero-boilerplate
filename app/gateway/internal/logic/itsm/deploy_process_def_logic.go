package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeployProcessDefLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeployProcessDefLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeployProcessDefLogic {
	return &DeployProcessDefLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeployProcessDefLogic) DeployProcessDef(req *types.DeployProcessDefReqVO) error {
	_, err := l.svcCtx.ItsmRpc.DeployProcessDef(l.ctx, &itsm.DeployProcessDefReq{
		Id: req.Id,
	})
	return err
}
