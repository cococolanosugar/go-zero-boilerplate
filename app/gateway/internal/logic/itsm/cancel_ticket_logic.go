package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type CancelTicketLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCancelTicketLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CancelTicketLogic {
	return &CancelTicketLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CancelTicketLogic) CancelTicket(req *types.CancelTicketReqVO) error {
	userId := getUserIdFromCtx(l.ctx)

	_, err := l.svcCtx.ItsmRpc.CancelTicket(l.ctx, &itsm.CancelTicketReq{
		TicketId: req.Id,
		UserId:   userId,
		Reason:   req.Reason,
	})
	return err
}
