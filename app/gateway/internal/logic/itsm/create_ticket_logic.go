package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"
	workerClient "go-zero-boilerplate/app/worker/rpc/client/worker"

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
	userName := getUserNameFromCtx(l.ctx)

	rpcResp, err := l.svcCtx.ItsmRpc.CreateTicket(l.ctx, &itsm.CreateTicketReq{
		ProcDefId:     req.ProcDefId,
		Title:         req.Title,
		Priority:      req.Priority,
		InitiatorId:   userId,
		InitiatorName: userName,
		FormDataJson:  req.FormDataJson,
	})
	if err != nil {
		return nil, err
	}

	// 异步派发 Temporal 分布式 SLA 倒计时监控与超时预警工作流
	go func(ticketId int64, ticketNo string, priority string) {
		respSec := int32(3600) // P3 默认 60 分钟响应
		resSec := int32(28800) // P3 默认 8 小时解决
		switch priority {
		case "P1":
			respSec = 900
			resSec = 7200
		case "P2":
			respSec = 1800
			resSec = 14400
		case "P3":
			respSec = 3600
			resSec = 28800
		case "P4":
			respSec = 7200
			resSec = 86400
		}
		_, slaErr := l.svcCtx.WorkerRpc.StartItsmSlaWorkflow(context.Background(), &workerClient.StartItsmSlaWorkflowReq{
			TicketId:            ticketId,
			TicketNo:            ticketNo,
			ResponseDurationSec: respSec,
			ResolveDurationSec:  resSec,
		})
		if slaErr != nil {
			logx.Errorf("Failed to trigger ItsmSlaWorkflow for ticket %s: %v", ticketNo, slaErr)
		}
	}(rpcResp.Id, rpcResp.TicketNo, req.Priority)

	return &types.CreateTicketRespVO{
		Id:       rpcResp.Id,
		TicketNo: rpcResp.TicketNo,
	}, nil
}
