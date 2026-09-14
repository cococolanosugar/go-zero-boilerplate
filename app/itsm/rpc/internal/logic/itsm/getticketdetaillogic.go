package itsmlogic

import (
	"context"
	"errors"
	"fmt"

	"go-zero-boilerplate/app/itsm/model"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetTicketDetailLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetTicketDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTicketDetailLogic {
	return &GetTicketDetailLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetTicketDetailLogic) GetTicketDetail(in *itsm.GetTicketDetailReq) (*itsm.TicketDetailResp, error) {
	var inst *model.ItsmProcessInst
	var err error

	if in.Id > 0 {
		inst, err = l.svcCtx.ProcessInstModel.FindOne(l.ctx, in.Id)
	} else if in.TicketNo != "" {
		inst, err = l.svcCtx.ProcessInstModel.FindOneByTicketNo(l.ctx, in.TicketNo)
	} else {
		return nil, errors.New("id or ticketNo is required")
	}

	if err != nil {
		return nil, fmt.Errorf("ticket not found: %w", err)
	}

	// 获取关联流程定义
	procDef, _ := l.svcCtx.ProcessDefModel.FindOne(l.ctx, inst.ProcDefId)
	bpmnXml := ""
	formSchema := "{}"
	procName := ""
	if procDef != nil {
		bpmnXml = procDef.BpmnXml
		formSchema = procDef.FormSchema
		procName = procDef.ProcName
	}

	// 获取动态表单数据
	formData := "{}"
	ticketData, err := l.svcCtx.TicketDataModel.FindOneByInstId(l.ctx, inst.Id)
	if err == nil && ticketData != nil {
		formData = ticketData.FormData
	}

	// 获取活跃待办任务
	tasks, _ := l.svcCtx.TaskModel.FindActiveByInstId(l.ctx, inst.Id)
	var activeTaskItems []*itsm.TaskItem
	for _, t := range tasks {
		assigneeId := int64(0)
		if t.AssigneeId.Valid {
			assigneeId = t.AssigneeId.Int64
		}
		claimAt := ""
		if t.ClaimAt.Valid {
			claimAt = t.ClaimAt.Time.Format("2006-01-02 15:04:05")
		}
		activeTaskItems = append(activeTaskItems, &itsm.TaskItem{
			Id:           t.Id,
			InstId:       t.InstId,
			NodeId:       t.NodeId,
			NodeName:     t.NodeName,
			TaskType:     t.TaskType,
			ApprovalMode: t.ApprovalMode,
			AssigneeId:   assigneeId,
			Status:       t.Status,
			ClaimAt:      claimAt,
			CreateTime:   t.CreateTime.Format("2006-01-02 15:04:05"),
		})
	}

	// 获取流转审计日志
	logs, _ := l.svcCtx.TaskLogModel.FindByInstId(l.ctx, inst.Id)
	var logItems []*itsm.TaskLogItem
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
	}

	respDeadline := ""
	if inst.SlaResponseDeadline.Valid {
		respDeadline = inst.SlaResponseDeadline.Time.Format("2006-01-02 15:04:05")
	}
	resolveDeadline := ""
	if inst.SlaResolveDeadline.Valid {
		resolveDeadline = inst.SlaResolveDeadline.Time.Format("2006-01-02 15:04:05")
	}

	return &itsm.TicketDetailResp{
		Ticket: &itsm.TicketItem{
			Id:                  inst.Id,
			TicketNo:            inst.TicketNo,
			Title:               inst.Title,
			Priority:            inst.Priority,
			ProcDefId:           inst.ProcDefId,
			ProcName:            procName,
			InitiatorId:         inst.InitiatorId,
			CurrentNodeId:       inst.CurrentNodeId,
			CurrentNodeName:     inst.CurrentNodeName,
			Status:              inst.Status,
			SlaStatus:           inst.SlaStatus,
			SlaResponseDeadline: respDeadline,
			SlaResolveDeadline:  resolveDeadline,
			CreateTime:          inst.CreateTime.Format("2006-01-02 15:04:05"),
		},
		FormDataJson:   formData,
		FormSchemaJson: formSchema,
		BpmnXml:        bpmnXml,
		ActiveTasks:    activeTaskItems,
		Logs:           logItems,
	}, nil
}
