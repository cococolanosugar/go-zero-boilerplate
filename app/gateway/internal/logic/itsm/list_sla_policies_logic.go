package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSlaPoliciesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListSlaPoliciesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSlaPoliciesLogic {
	return &ListSlaPoliciesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSlaPoliciesLogic) ListSlaPolicies() (resp *types.ListSlaPoliciesRespVO, err error) {
	rpcResp, err := l.svcCtx.ItsmRpc.ListSlaPolicies(l.ctx, &itsm.ListSlaPoliciesReq{})
	if err != nil {
		return nil, err
	}

	var list []types.SlaPolicyVO
	for _, p := range rpcResp.List {
		list = append(list, types.SlaPolicyVO{
			Id:               p.Id,
			Priority:         p.Priority,
			CalendarType:     p.CalendarType,
			ResponseLimitMin: p.ResponseLimitMin,
			ResolveLimitMin:  p.ResolveLimitMin,
			WarnThresholdPct: p.WarnThresholdPct,
		})
	}

	return &types.ListSlaPoliciesRespVO{List: list}, nil
}
