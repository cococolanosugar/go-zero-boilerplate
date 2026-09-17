package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSlaPolicyLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateSlaPolicyLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSlaPolicyLogic {
	return &UpdateSlaPolicyLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateSlaPolicyLogic) UpdateSlaPolicy(req *types.UpdateSlaPolicyReqVO) error {
	_, err := l.svcCtx.ItsmRpc.UpdateSlaPolicy(l.ctx, &itsm.UpdateSlaPolicyReq{
		Id:               req.Id,
		ResponseLimitMin: req.ResponseLimitMin,
		ResolveLimitMin:  req.ResolveLimitMin,
		WarnThresholdPct: req.WarnThresholdPct,
	})
	return err
}
