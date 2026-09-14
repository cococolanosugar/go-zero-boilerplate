package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateTicketLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateTicketLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateTicketLogic {
	return &CreateTicketLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateTicketLogic) CreateTicket(req *types.CreateTicketReqVO) (resp *types.CreateTicketRespVO, err error) {
	userId := getUserIdFromCtx(l.ctx)

	rpcResp, err := l.svcCtx.ItsmRpc.CreateTicket(l.ctx, &itsm.CreateTicketReq{
		ProcDefId:    req.ProcDefId,
		Title:        req.Title,
		Priority:     req.Priority,
		InitiatorId:  userId,
		FormDataJson: req.FormDataJson,
	})
	if err != nil {
		return nil, err
	}

	return &types.CreateTicketRespVO{
		Id:       rpcResp.Id,
		TicketNo: rpcResp.TicketNo,
	}, nil
}
