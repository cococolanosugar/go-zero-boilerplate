package itsmlogic

import (
	"context"
	"errors"
	"time"

	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSlaPolicyLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateSlaPolicyLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSlaPolicyLogic {
	return &UpdateSlaPolicyLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateSlaPolicyLogic) UpdateSlaPolicy(in *itsm.UpdateSlaPolicyReq) (*itsm.CommonResp, error) {
	record, err := l.svcCtx.SlaPolicyModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, errors.New("sla policy not found")
	}

	if in.ResponseLimitMin > 0 {
		record.ResponseLimitMin = int64(in.ResponseLimitMin)
	}
	if in.ResolveLimitMin > 0 {
		record.ResolveLimitMin = int64(in.ResolveLimitMin)
	}
	if in.WarnThresholdPct > 0 {
		record.WarnThresholdPct = int64(in.WarnThresholdPct)
	}
	record.UpdateTime = time.Now()

	if err := l.svcCtx.SlaPolicyModel.Update(l.ctx, record); err != nil {
		return nil, err
	}

	return &itsm.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
