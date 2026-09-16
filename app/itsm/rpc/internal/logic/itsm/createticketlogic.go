package itsmlogic

import (
	"context"
	"database/sql"
	"fmt"
	"math/rand"
	"time"

	"go-zero-boilerplate/app/itsm/model"
	"go-zero-boilerplate/app/itsm/rpc/internal/engine"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateTicketLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateTicketLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateTicketLogic {
	return &CreateTicketLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateTicketLogic) CreateTicket(in *itsm.CreateTicketReq) (*itsm.CreateTicketResp, error) {
	if in.ProcDefId <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}
	if in.Title == "" {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	procDef, err := l.svcCtx.ProcessDefModel.FindOne(l.ctx, in.ProcDefId)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ItsmProcessDefNotFound)
	}

	// 解析 BPMN 流程图计算第一个激活节点
	graph, err := engine.ParseBPMNXML(procDef.BpmnXml)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ItsmInvalidBpmnXml)
	}

	firstNodes, err := graph.GetNextNodes(graph.StartNode.ID, nil)
	if err != nil || len(firstNodes) == 0 {
		return nil, xerr.NewErrCode(xerr.ItsmInvalidBpmnXml)
	}
	initialNode := firstNodes[0]

	// 计算优先级与 SLA 截止时间
	priority := in.Priority
	if priority == "" {
		priority = "P3"
	}
	respLimit := 60
	resolveLimit := 480
	slaPolicy, err := l.svcCtx.SlaPolicyModel.FindByPriority(l.ctx, priority)
	if err == nil && slaPolicy != nil {
		respLimit = int(slaPolicy.ResponseLimitMin)
		resolveLimit = int(slaPolicy.ResolveLimitMin)
	}

	now := time.Now()
	respDeadline := now.Add(time.Duration(respLimit) * time.Minute)
	resolveDeadline := now.Add(time.Duration(resolveLimit) * time.Minute)

	// 生成唯一流水单号
	rand.Seed(time.Now().UnixNano())
	ticketNo := fmt.Sprintf("INC%s%04d", now.Format("20060102150405"), rand.Intn(10000))

	formData := in.FormDataJson
	if formData == "" {
		formData = "{}"
	}

	// 1. 创建流程实例
	instData := &model.ItsmProcessInst{
		ProcDefId:           procDef.Id,
		TicketNo:            ticketNo,
		Title:               in.Title,
		Priority:            priority,
		InitiatorId:         in.InitiatorId,
		CurrentNodeId:       initialNode.ID,
		CurrentNodeName:     initialNode.Name,
		Status:              "RUNNING",
		SlaStatus:           "NORMAL",
		SlaResponseDeadline: sql.NullTime{Time: respDeadline, Valid: true},
		SlaResolveDeadline:  sql.NullTime{Time: resolveDeadline, Valid: true},
		CreateTime:          now,
		UpdateTime:          now,
	}

	instRes, err := l.svcCtx.ProcessInstModel.Insert(l.ctx, instData)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ItsmCreateFailed)
	}
	instId, err := instRes.LastInsertId()
	if err != nil {
		return nil, err
	}

	// 2. 创建动态表单数据快照
	_, _ = l.svcCtx.TicketDataModel.Insert(l.ctx, &model.ItsmTicketData{
		InstId:     instId,
		FormData:   formData,
		CreateTime: now,
		UpdateTime: now,
	})

	// 3. 创建首个待办节点任务
	taskRes, err := l.svcCtx.TaskModel.Insert(l.ctx, &model.ItsmTask{
		InstId:       instId,
		NodeId:       initialNode.ID,
		NodeName:     initialNode.Name,
		TaskType:     "USER_TASK",
		ApprovalMode: "SINGLE",
		Status:       "READY",
		CreateTime:   now,
	})
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ItsmCreateFailed)
	}
	taskId, _ := taskRes.LastInsertId()

	// 4. 记录发起流转审计日志
	_, _ = l.svcCtx.TaskLogModel.Insert(l.ctx, &model.ItsmTaskLog{
		InstId:       instId,
		TaskId:       sql.NullInt64{Int64: taskId, Valid: true},
		NodeId:       graph.StartNode.ID,
		NodeName:     graph.StartNode.Name,
		OperatorId:   in.InitiatorId,
		OperatorName: in.InitiatorName,
		ActionType:   "CREATE",
		Opinion:      sql.NullString{String: "发起提报工单", Valid: true},
		DurationSec:  0,
		CreateTime:   now,
	})

	return &itsm.CreateTicketResp{
		Id:       instId,
		TicketNo: ticketNo,
	}, nil
}
