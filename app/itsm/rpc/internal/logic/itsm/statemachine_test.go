package itsmlogic

import (
	"context"
	"testing"
	"time"

	"go-zero-boilerplate/app/itsm/rpc/internal/config"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

func setupTestContext(t *testing.T) *svc.ServiceContext {
	c := config.Config{
		DataSource: "root:root@tcp(127.0.0.1:3306)/go_zero_boilerplate?charset=utf8mb4&parseTime=true&loc=Asia%2FShanghai",
		Cache: cache.CacheConf{
			{
				RedisConf: redis.RedisConf{
					Host: "127.0.0.1:6379",
					Type: "node",
				},
				Weight: 100,
			},
		},
	}
	conn := sqlx.NewMysql(c.DataSource)
	// 验证数据库连接
	if err := conn.TransactCtx(context.Background(), func(ctx context.Context, s sqlx.Session) error {
		return nil
	}); err != nil {
		t.Skip("MySQL not accessible for integration test, skipping: ", err)
	}

	return svc.NewServiceContext(c)
}

const testBPMN = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <process id="Test_Flow" name="测试审批流程" isExecutable="true">
    <startEvent id="Start_1"><outgoing>F1</outgoing></startEvent>
    <sequenceFlow id="F1" sourceRef="Start_1" targetRef="Task_1" />
    <userTask id="Task_1" name="主管初审"><incoming>F1</incoming><outgoing>F2</outgoing></userTask>
    <sequenceFlow id="F2" sourceRef="Task_1" targetRef="End_1" />
    <endEvent id="End_1" name="结束"><incoming>F2</incoming></endEvent>
  </process>
</definitions>`

func TestTicketLifecycle_Flow(t *testing.T) {
	svcCtx := setupTestContext(t)
	ctx := context.Background()

	// 1. 创建并发布测试流程定义
	createDefL := NewCreateProcessDefLogic(ctx, svcCtx)
	procCode := "test_flow_" + time.Now().Format("150405")
	defResp, err := createDefL.CreateProcessDef(&itsm.CreateProcessDefReq{
		ProcCode:    procCode,
		ProcName:    "自动化测试审批流",
		Category:    "test",
		BpmnXml:     testBPMN,
		FormSchema:  `{"type":"object","properties":{"reason":{"type":"string"}}}`,
		Description: "测试流程",
		CreatedBy:   1,
	})
	if err != nil {
		t.Fatalf("failed to create process def: %v", err)
	}

	deployL := NewDeployProcessDefLogic(ctx, svcCtx)
	_, err = deployL.DeployProcessDef(&itsm.DeployProcessDefReq{Id: defResp.Id})
	if err != nil {
		t.Fatalf("failed to deploy process def: %v", err)
	}

	// 2. 创建工单
	createTicketL := NewCreateTicketLogic(ctx, svcCtx)
	ticketResp, err := createTicketL.CreateTicket(&itsm.CreateTicketReq{
		ProcDefId:     defResp.Id,
		Title:         "自动化集成测试工单",
		Priority:      "P2",
		InitiatorId:   1001,
		InitiatorName: "张三",
		FormDataJson:  `{"reason":"申请开通服务器权限"}`,
	})
	if err != nil {
		t.Fatalf("failed to create ticket: %v", err)
	}

	// 3. 查询工单详情并获取首个待办任务
	detailL := NewGetTicketDetailLogic(ctx, svcCtx)
	detail, err := detailL.GetTicketDetail(&itsm.GetTicketDetailReq{Id: ticketResp.Id})
	if err != nil {
		t.Fatalf("failed to get ticket detail: %v", err)
	}
	if len(detail.ActiveTasks) == 0 {
		t.Fatalf("expected at least 1 active task, got 0")
	}
	firstTask := detail.ActiveTasks[0]
	if firstTask.Status != "READY" {
		t.Errorf("expected task status READY, got %s", firstTask.Status)
	}

	// 4. 认领任务
	claimL := NewClaimTaskLogic(ctx, svcCtx)
	_, err = claimL.ClaimTask(&itsm.ClaimTaskReq{
		TaskId:   firstTask.Id,
		UserId:   2001,
		UserName: "李主管",
	})
	if err != nil {
		t.Fatalf("failed to claim task: %v", err)
	}

	// 5. 审批通过 (流转至 End_1)
	approveL := NewApproveTaskLogic(ctx, svcCtx)
	_, err = approveL.ApproveTask(&itsm.ApproveTaskReq{
		TaskId:   firstTask.Id,
		UserId:   2001,
		UserName: "李主管",
		Opinion:  "同意开通",
	})
	if err != nil {
		t.Fatalf("failed to approve task: %v", err)
	}

	// 6. 验证工单最终状态为 APPROVED
	detailAfter, err := detailL.GetTicketDetail(&itsm.GetTicketDetailReq{Id: ticketResp.Id})
	if err != nil {
		t.Fatalf("failed to get ticket detail after approve: %v", err)
	}
	if detailAfter.Ticket.Status != "APPROVED" {
		t.Errorf("expected ticket status APPROVED, got %s", detailAfter.Ticket.Status)
	}

	// 清理测试数据
	_ = svcCtx.ProcessDefModel.Delete(ctx, defResp.Id)
	_ = svcCtx.ProcessInstModel.Delete(ctx, ticketResp.Id)
	_ = svcCtx.TicketDataModel.Delete(ctx, ticketResp.Id)
}

const testMultiStepBPMN = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <process id="Test_CrossDept_Flow" name="跨部门联合审批与执行流程" isExecutable="true">
    <startEvent id="Start_1"><outgoing>F1</outgoing></startEvent>
    <sequenceFlow id="F1" sourceRef="Start_1" targetRef="Activity_Leader" />
    <userTask id="Activity_Leader" name="部门主管初审"><incoming>F1</incoming><outgoing>F2</outgoing></userTask>
    <sequenceFlow id="F2" sourceRef="Activity_Leader" targetRef="Activity_Ops" />
    <userTask id="Activity_Ops" name="IT运维专家实施"><incoming>F2</incoming><outgoing>F3</outgoing></userTask>
    <sequenceFlow id="F3" sourceRef="Activity_Ops" targetRef="End_1" />
    <endEvent id="End_1" name="办结归档"><incoming>F3</incoming></endEvent>
  </process>
</definitions>`

func TestTicketMultiStep_RejectAndTransfer(t *testing.T) {
	svcCtx := setupTestContext(t)
	ctx := context.Background()

	// 1. 创建并发布跨部门多步骤流程
	createDefL := NewCreateProcessDefLogic(ctx, svcCtx)
	procCode := "cross_dept_" + time.Now().Format("150405")
	defResp, err := createDefL.CreateProcessDef(&itsm.CreateProcessDefReq{
		ProcCode:    procCode,
		ProcName:    "跨部门运维变更审批流程",
		Category:    "IT_OPS",
		BpmnXml:     testMultiStepBPMN,
		FormSchema:  `{"type":"object","properties":{"reason":{"type":"string"}}}`,
		Description: "跨部门多节点测试",
		CreatedBy:   1,
	})
	if err != nil {
		t.Fatalf("failed to create multi-step process def: %v", err)
	}

	deployL := NewDeployProcessDefLogic(ctx, svcCtx)
	_, err = deployL.DeployProcessDef(&itsm.DeployProcessDefReq{Id: defResp.Id})
	if err != nil {
		t.Fatalf("failed to deploy process def: %v", err)
	}

	// 2. 场景 A: 发起工单 -> 转派 -> 主管审批 -> 运维执行 -> 正常办结
	createTicketL := NewCreateTicketLogic(ctx, svcCtx)
	ticketResp, err := createTicketL.CreateTicket(&itsm.CreateTicketReq{
		ProcDefId:     defResp.Id,
		Title:         "生产服务器数据库扩容申请",
		Priority:      "P1",
		InitiatorId:   1001,
		InitiatorName: "研发小王",
		FormDataJson:  `{"reason":"大促前容量扩充"}`,
	})
	if err != nil {
		t.Fatalf("failed to create ticket: %v", err)
	}

	// 获取节点1待办任务
	detailL := NewGetTicketDetailLogic(ctx, svcCtx)
	detail, err := detailL.GetTicketDetail(&itsm.GetTicketDetailReq{Id: ticketResp.Id})
	if err != nil || len(detail.ActiveTasks) == 0 {
		t.Fatalf("failed to get active task: %v", err)
	}
	task1 := detail.ActiveTasks[0]
	if task1.NodeId != "Activity_Leader" {
		t.Errorf("expected node Activity_Leader, got %s", task1.NodeId)
	}

	// 转派任务给赵主管
	transferL := NewTransferTaskLogic(ctx, svcCtx)
	_, err = transferL.TransferTask(&itsm.TransferTaskReq{
		TaskId:       task1.Id,
		UserId:       2001,
		UserName:     "王主管",
		TargetUserId: 2002,
		Opinion:      "王主管外出，由赵主管代行审批",
	})
	if err != nil {
		t.Fatalf("failed to transfer task: %v", err)
	}

	// 赵主管审批通过
	approveL := NewApproveTaskLogic(ctx, svcCtx)
	_, err = approveL.ApproveTask(&itsm.ApproveTaskReq{
		TaskId:   task1.Id,
		UserId:   2002,
		UserName: "赵主管",
		Opinion:  "业务诉求合理，准予变更",
	})
	if err != nil {
		t.Fatalf("failed to approve task1: %v", err)
	}

	// 校验流转至节点2: Activity_Ops
	detailNode2, err := detailL.GetTicketDetail(&itsm.GetTicketDetailReq{Id: ticketResp.Id})
	if err != nil || len(detailNode2.ActiveTasks) == 0 {
		t.Fatalf("failed to transition to node2: %v", err)
	}
	task2 := detailNode2.ActiveTasks[0]
	if task2.NodeId != "Activity_Ops" {
		t.Errorf("expected node Activity_Ops, got %s", task2.NodeId)
	}

	// 校验流转轨迹查看接口
	trajL := NewGetTicketTrajectoryLogic(ctx, svcCtx)
	traj, err := trajL.GetTicketTrajectory(&itsm.GetTicketTrajectoryReq{TicketId: ticketResp.Id})
	if err != nil {
		t.Fatalf("failed to get trajectory: %v", err)
	}
	hasCompletedLeader := false
	for _, cid := range traj.CompletedNodeIds {
		if cid == "Activity_Leader" {
			hasCompletedLeader = true
			break
		}
	}
	if !hasCompletedLeader {
		t.Errorf("expected completed node Activity_Leader, got %v", traj.CompletedNodeIds)
	}
	if len(traj.ActiveNodeIds) == 0 || traj.ActiveNodeIds[0] != "Activity_Ops" {
		t.Errorf("expected active node Activity_Ops, got %v", traj.ActiveNodeIds)
	}

	// 节点2 运维实施完成
	_, err = approveL.ApproveTask(&itsm.ApproveTaskReq{
		TaskId:   task2.Id,
		UserId:   3001,
		UserName: "运维工程师小李",
		Opinion:  "变更执行完毕，监控平稳",
	})
	if err != nil {
		t.Fatalf("failed to approve task2: %v", err)
	}

	// 校验最终办结状态
	finalDetail, err := detailL.GetTicketDetail(&itsm.GetTicketDetailReq{Id: ticketResp.Id})
	if err != nil || finalDetail.Ticket.Status != "APPROVED" {
		t.Errorf("expected final status APPROVED, got %s", finalDetail.Ticket.Status)
	}

	// 3. 场景 B: 驳回流转验证
	rejectTicketResp, err := createTicketL.CreateTicket(&itsm.CreateTicketReq{
		ProcDefId:     defResp.Id,
		Title:         "异常权限申请工单",
		Priority:      "P3",
		InitiatorId:   1002,
		InitiatorName: "李四",
	})
	if err != nil {
		t.Fatalf("failed to create reject ticket: %v", err)
	}

	rejectDetail, _ := detailL.GetTicketDetail(&itsm.GetTicketDetailReq{Id: rejectTicketResp.Id})
	rejectTask := rejectDetail.ActiveTasks[0]

	rejectL := NewRejectTaskLogic(ctx, svcCtx)
	_, err = rejectL.RejectTask(&itsm.RejectTaskReq{
		TaskId:   rejectTask.Id,
		UserId:   2001,
		UserName: "审批主管",
		Opinion:  "申请理由不充分，予以驳回",
	})
	if err != nil {
		t.Fatalf("failed to reject task: %v", err)
	}

	afterRejectDetail, _ := detailL.GetTicketDetail(&itsm.GetTicketDetailReq{Id: rejectTicketResp.Id})
	if afterRejectDetail.Ticket.Status != "REJECTED" {
		t.Errorf("expected status REJECTED, got %s", afterRejectDetail.Ticket.Status)
	}

	// 清理测试数据
	_ = svcCtx.ProcessDefModel.Delete(ctx, defResp.Id)
	_ = svcCtx.ProcessInstModel.Delete(ctx, ticketResp.Id)
	_ = svcCtx.ProcessInstModel.Delete(ctx, rejectTicketResp.Id)
}

