package itsmlogic

import (
	"context"
	"errors"

	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetTicketTrajectoryLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetTicketTrajectoryLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTicketTrajectoryLogic {
	return &GetTicketTrajectoryLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetTicketTrajectoryLogic) GetTicketTrajectory(in *itsm.GetTicketTrajectoryReq) (*itsm.TicketTrajectoryResp, error) {
	inst, err := l.svcCtx.ProcessInstModel.FindOne(l.ctx, in.TicketId)
	if err != nil {
		return nil, errors.New("ticket not found")
	}

	procDef, err := l.svcCtx.ProcessDefModel.FindOne(l.ctx, inst.ProcDefId)
	if err != nil {
		return nil, errors.New("process definition not found")
	}

	logs, _ := l.svcCtx.TaskLogModel.FindByInstId(l.ctx, inst.Id)
	var logItems []*itsm.TaskLogItem
	var completedNodeIds []string
	var rejectedNodeIds []string

	for _, lItem := range logs {
		taskId := int64(0)
		if lItem.TaskId.Valid {
			taskId = lItem.TaskId.Int64
		}
		opinion := ""
		if lItem.Opinion.Valid {
			opinion = lItem.Opinion.String
		}

		logItems = append(logItems, &itsm.TaskLogItem{
			Id:           lItem.Id,
			TaskId:       taskId,
			NodeId:       lItem.NodeId,
			NodeName:     lItem.NodeName,
			OperatorId:   lItem.OperatorId,
			OperatorName: lItem.OperatorName,
			ActionType:   lItem.ActionType,
			Opinion:      opinion,
			DurationSec:  int32(lItem.DurationSec),
			CreateTime:   lItem.CreateTime.Format("2006-01-02 15:04:05"),
		})

		if lItem.ActionType == "APPROVE" || lItem.ActionType == "CREATE" {
			completedNodeIds = append(completedNodeIds, lItem.NodeId)
		} else if lItem.ActionType == "REJECT" {
			rejectedNodeIds = append(rejectedNodeIds, lItem.NodeId)
		}
	}

	activeTasks, _ := l.svcCtx.TaskModel.FindActiveByInstId(l.ctx, inst.Id)
	var activeNodeIds []string
	for _, at := range activeTasks {
		activeNodeIds = append(activeNodeIds, at.NodeId)
	}

	return &itsm.TicketTrajectoryResp{
		BpmnXml:          procDef.BpmnXml,
		CompletedNodeIds: completedNodeIds,
		ActiveNodeIds:    activeNodeIds,
		RejectedNodeIds:  rejectedNodeIds,
		Logs:             logItems,
	}, nil
}
