package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetTicketDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetTicketDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTicketDetailLogic {
	return &GetTicketDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetTicketDetailLogic) GetTicketDetail(req *types.GetTicketDetailReqVO) (resp *types.TicketDetailRespVO, err error) {
	rpcResp, err := l.svcCtx.ItsmRpc.GetTicketDetail(l.ctx, &itsm.GetTicketDetailReq{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	ticket := rpcResp.Ticket
	var tasks []types.TaskVO
	for _, t := range rpcResp.ActiveTasks {
		tasks = append(tasks, types.TaskVO{
			Id:           t.Id,
			InstId:       t.InstId,
			NodeId:       t.NodeId,
			NodeName:     t.NodeName,
			TaskType:     t.TaskType,
			ApprovalMode: t.ApprovalMode,
			AssigneeId:   t.AssigneeId,
			AssigneeName: t.AssigneeName,
			Status:       t.Status,
			ClaimAt:      t.ClaimAt,
			CreateTime:   t.CreateTime,
		})
	}

	var logs []types.TaskLogVO
	for _, lItem := range rpcResp.Logs {
		logs = append(logs, types.TaskLogVO{
			Id:           lItem.Id,
			TaskId:       lItem.TaskId,
			NodeId:       lItem.NodeId,
			NodeName:     lItem.NodeName,
			OperatorId:   lItem.OperatorId,
			OperatorName: lItem.OperatorName,
			ActionType:   lItem.ActionType,
			Opinion:      lItem.Opinion,
			DurationSec:  lItem.DurationSec,
			CreateTime:   lItem.CreateTime,
		})
	}

	return &types.TicketDetailRespVO{
		Ticket: types.TicketVO{
			Id:                  ticket.Id,
			TicketNo:            ticket.TicketNo,
			Title:               ticket.Title,
			Priority:            ticket.Priority,
			ProcDefId:           ticket.ProcDefId,
			ProcName:            ticket.ProcName,
			InitiatorId:         ticket.InitiatorId,
			InitiatorName:       ticket.InitiatorName,
			CurrentNodeId:       ticket.CurrentNodeId,
			CurrentNodeName:     ticket.CurrentNodeName,
			Status:              ticket.Status,
			SlaStatus:           ticket.SlaStatus,
			SlaResponseDeadline: ticket.SlaResponseDeadline,
			SlaResolveDeadline:  ticket.SlaResolveDeadline,
			CreateTime:          ticket.CreateTime,
		},
		FormDataJson:   rpcResp.FormDataJson,
		FormSchemaJson: rpcResp.FormSchemaJson,
		BpmnXml:        rpcResp.BpmnXml,
		ActiveTasks:    tasks,
		Logs:           logs,
	}, nil
}
