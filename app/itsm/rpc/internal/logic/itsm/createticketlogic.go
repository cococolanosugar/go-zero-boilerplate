package itsmlogic

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"time"

	"go-zero-boilerplate/app/itsm/rpc/internal/engine"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
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
	if procDef.Status != 2 {
		return nil, xerr.NewErrMsg("该服务流程尚未发布上线或已停用，无法发起工单")
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
	ticketNo := fmt.Sprintf("INC%s%04d", now.Format("20060102150405"), rand.Intn(10000))

	formData := in.FormDataJson
	if formData == "" {
		formData = "{}"
	}

	initiatorName := in.InitiatorName
	if initiatorName == "" {
		initiatorName = fmt.Sprintf("用户%d", in.InitiatorId)
	}

	var instId int64
	err = l.svcCtx.SqlConn.TransactCtx(l.ctx, func(ctx context.Context, session sqlx.Session) error {
		// 1. 创建流程实例
		instQuery := `INSERT INTO itsm_process_inst (proc_def_id, ticket_no, title, priority, initiator_id, current_node_id, current_node_name, status, sla_status, sla_response_deadline, sla_resolve_deadline, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		instRes, err := session.ExecCtx(ctx, instQuery, procDef.Id, ticketNo, in.Title, priority, in.InitiatorId, initialNode.ID, initialNode.Name, "RUNNING", "NORMAL", respDeadline, resolveDeadline, now, now)
		if err != nil {
			return err
		}
		instId, err = instRes.LastInsertId()
		if err != nil {
			return err
		}

		// 2. 创建动态表单数据快照
		dataQuery := `INSERT INTO itsm_ticket_data (inst_id, form_data, create_time, update_time) VALUES (?, ?, ?, ?)`
		if _, err := session.ExecCtx(ctx, dataQuery, instId, formData, now, now); err != nil {
			return err
		}

		// 3. 创建首个待办节点任务 (携带 BPMN 设计器配置的审批模式与候选人/角色)
		approvalMode := "SINGLE"
		if initialNode.ApprovalMode != "" {
			approvalMode = initialNode.ApprovalMode
		}
		var candidateUsersJson, candidateRolesJson interface{}
		if len(initialNode.CandidateUsers) > 0 {
			if b, err := json.Marshal(initialNode.CandidateUsers); err == nil {
				candidateUsersJson = string(b)
			}
		}
		if len(initialNode.CandidateRoles) > 0 {
			if b, err := json.Marshal(initialNode.CandidateRoles); err == nil {
				candidateRolesJson = string(b)
			}
		}

		taskQuery := `INSERT INTO itsm_task (inst_id, node_id, node_name, task_type, approval_mode, candidate_users, candidate_roles, status, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		taskRes, err := session.ExecCtx(ctx, taskQuery, instId, initialNode.ID, initialNode.Name, "USER_TASK", approvalMode, candidateUsersJson, candidateRolesJson, "READY", now)
		if err != nil {
			return err
		}
		taskId, err := taskRes.LastInsertId()
		if err != nil {
			return err
		}

		// 4. 记录发起流转审计日志
		logQuery := `INSERT INTO itsm_task_log (inst_id, task_id, node_id, node_name, operator_id, operator_name, action_type, opinion, duration_sec, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		if _, err := session.ExecCtx(ctx, logQuery, instId, taskId, graph.StartNode.ID, graph.StartNode.Name, in.InitiatorId, initiatorName, "CREATE", "发起提报工单", 0, now); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		l.Logger.Errorf("CreateTicket transaction failed: %v", err)
		return nil, xerr.NewErrCode(xerr.ItsmCreateFailed)
	}

	return &itsm.CreateTicketResp{
		Id:       instId,
		TicketNo: ticketNo,
	}, nil
}
