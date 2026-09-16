package itsmlogic

import (
	"context"
	"database/sql"
	"time"

	"go-zero-boilerplate/app/itsm/model"
	"go-zero-boilerplate/app/itsm/rpc/internal/engine"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ApproveTaskLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewApproveTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ApproveTaskLogic {
	return &ApproveTaskLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ApproveTaskLogic) ApproveTask(in *itsm.ApproveTaskReq) (*itsm.CommonResp, error) {
	task, err := l.svcCtx.TaskModel.FindOne(l.ctx, in.TaskId)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ItsmTaskNotFound)
	}
	if task.Status != "READY" && task.Status != "CLAIMED" {
		return nil, xerr.NewErrCode(xerr.ItsmTaskAlreadyDone)
	}

	// 越权防护：若任务已被指定/认领办理人，仅该办理人或超级管理员(ID: 1)可执行审批
	if task.Status == "CLAIMED" && task.AssigneeId.Valid && task.AssigneeId.Int64 != in.UserId && in.UserId != 1 {
		return nil, xerr.NewErrCode(xerr.Forbidden)
	}

	inst, err := l.svcCtx.ProcessInstModel.FindOne(l.ctx, task.InstId)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ItsmInstanceNotFound)
	}

	now := time.Now()
	task.Status = "COMPLETED"
	task.CompletedAt = sql.NullTime{Time: now, Valid: true}
	task.AssigneeId = sql.NullInt64{Int64: in.UserId, Valid: true}
	if err := l.svcCtx.TaskModel.Update(l.ctx, task); err != nil {
		return nil, err
	}

	// 记录处理审计日志
	duration := int(now.Sub(task.CreateTime).Seconds())
	_, _ = l.svcCtx.TaskLogModel.Insert(l.ctx, &model.ItsmTaskLog{
		InstId:       task.InstId,
		TaskId:       sql.NullInt64{Int64: task.Id, Valid: true},
		NodeId:       task.NodeId,
		NodeName:     task.NodeName,
		OperatorId:   in.UserId,
		OperatorName: in.UserName,
		ActionType:   "APPROVE",
		Opinion:      sql.NullString{String: in.Opinion, Valid: in.Opinion != ""},
		DurationSec:  int64(duration),
		CreateTime:   now,
	})

	// 若在当前审批节点修改了表单数据，更新动态表单
	if in.UpdatedFormDataJson != "" {
		ticketData, err := l.svcCtx.TicketDataModel.FindOneByInstId(l.ctx, inst.Id)
		if err == nil && ticketData != nil {
			ticketData.FormData = in.UpdatedFormDataJson
			ticketData.UpdateTime = now
			_ = l.svcCtx.TicketDataModel.Update(l.ctx, ticketData)
		}
	}

	// 依据 BPMN 流程图流转到下一节点
	procDef, err := l.svcCtx.ProcessDefModel.FindOne(l.ctx, inst.ProcDefId)
	if err != nil {
		return nil, err
	}

	graph, err := engine.ParseBPMNXML(procDef.BpmnXml)
	if err != nil {
		return nil, err
	}

	nextNodes, err := graph.GetNextNodes(task.NodeId, map[string]interface{}{
		"approved": true,
	})
	if err != nil {
		return nil, err
	}

	if len(nextNodes) == 0 || nextNodes[0].Type == engine.ElementTypeEndEvent {
		// 流程完成，标记工单办结
		inst.Status = "APPROVED"
		inst.ResolvedAt = sql.NullTime{Time: now, Valid: true}
		inst.CurrentNodeId = ""
		inst.CurrentNodeName = "已办结"
	} else {
		// 流转至后续用户任务
		nextNode := nextNodes[0]
		inst.CurrentNodeId = nextNode.ID
		inst.CurrentNodeName = nextNode.Name

		_, err = l.svcCtx.TaskModel.Insert(l.ctx, &model.ItsmTask{
			InstId:       inst.Id,
			NodeId:       nextNode.ID,
			NodeName:     nextNode.Name,
			TaskType:     "USER_TASK",
			ApprovalMode: "SINGLE",
			Status:       "READY",
			CreateTime:   now,
		})
		if err != nil {
			return nil, err
		}
	}

	inst.UpdateTime = now
	if err := l.svcCtx.ProcessInstModel.Update(l.ctx, inst); err != nil {
		return nil, err
	}

	return &itsm.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
