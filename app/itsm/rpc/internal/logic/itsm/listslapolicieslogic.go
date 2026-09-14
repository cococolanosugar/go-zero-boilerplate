package itsmlogic

import (
	"context"

	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSlaPoliciesLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSlaPoliciesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSlaPoliciesLogic {
	return &ListSlaPoliciesLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSlaPoliciesLogic) ListSlaPolicies(in *itsm.ListSlaPoliciesReq) (*itsm.ListSlaPoliciesResp, error) {
	list, err := l.svcCtx.SlaPolicyModel.ListAll(l.ctx)
	if err != nil {
		return nil, err
	}

	var items []*itsm.SlaPolicyItem
	for _, p := range list {
		items = append(items, &itsm.SlaPolicyItem{
			Id:                 p.Id,
			Priority:           p.Priority,
			CalendarType:       p.CalendarType,
			ResponseLimitMin:   int32(p.ResponseLimitMin),
			ResolveLimitMin:    int32(p.ResolveLimitMin),
			WarnThresholdPct:   int32(p.WarnThresholdPct),
		})
	}

	return &itsm.ListSlaPoliciesResp{List: items}, nil
}
