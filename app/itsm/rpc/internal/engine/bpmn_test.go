package engine

import (
	"testing"
)

const sampleBPMNXML = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" targetNamespace="http://bpmn.io/schema/bpmn">
  <process id="Process_Ticket_Approval" name="IT运维报修审批流程" isExecutable="true">
    <startEvent id="StartEvent_1" name="提报工单">
      <outgoing>Flow_1</outgoing>
    </startEvent>
    <sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Activity_LeaderApproval" />
    
    <userTask id="Activity_LeaderApproval" name="部门主管审批">
      <incoming>Flow_1</incoming>
      <outgoing>Flow_2</outgoing>
    </userTask>
    <sequenceFlow id="Flow_2" sourceRef="Activity_LeaderApproval" targetRef="Gateway_ApprovalDecision" />
    
    <exclusiveGateway id="Gateway_ApprovalDecision" name="审批网关">
      <incoming>Flow_2</incoming>
      <outgoing>Flow_Pass</outgoing>
      <outgoing>Flow_Reject</outgoing>
    </exclusiveGateway>
    
    <sequenceFlow id="Flow_Pass" name="同意" sourceRef="Gateway_ApprovalDecision" targetRef="Activity_ITOps">
      <conditionExpression>${approved == true}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="Flow_Reject" name="驳回" sourceRef="Gateway_ApprovalDecision" targetRef="EndEvent_Rejected">
      <conditionExpression>${approved == false}</conditionExpression>
    </sequenceFlow>
    
    <userTask id="Activity_ITOps" name="IT运维工程师处理">
      <incoming>Flow_Pass</incoming>
      <outgoing>Flow_3</outgoing>
    </userTask>
    <sequenceFlow id="Flow_3" sourceRef="Activity_ITOps" targetRef="EndEvent_Completed" />
    
    <endEvent id="EndEvent_Completed" name="流程归档完成">
      <incoming>Flow_3</incoming>
    </endEvent>
    <endEvent id="EndEvent_Rejected" name="流程已驳回终止">
      <incoming>Flow_Reject</incoming>
    </endEvent>
  </process>
</definitions>`

func TestParseBPMNXML_Success(t *testing.T) {
	graph, err := ParseBPMNXML(sampleBPMNXML)
	if err != nil {
		t.Fatalf("unexpected error parsing valid bpmn xml: %v", err)
	}

	if graph.ProcessID != "Process_Ticket_Approval" {
		t.Errorf("expected ProcessID Process_Ticket_Approval, got %s", graph.ProcessID)
	}

	if graph.StartNode == nil || graph.StartNode.ID != "StartEvent_1" {
		t.Errorf("expected StartNode StartEvent_1, got %+v", graph.StartNode)
	}

	if len(graph.Nodes) != 6 { // Start, LeaderTask, Gateway, ITOpsTask, CompletedEnd, RejectedEnd
		t.Errorf("expected 6 nodes, got %d", len(graph.Nodes))
	}

	if len(graph.Flows) != 5 { // Flow_1, Flow_2, Flow_Pass, Flow_Reject, Flow_3
		t.Errorf("expected 5 flows, got %d", len(graph.Flows))
	}
}

func TestProcessGraph_GetNextNodes(t *testing.T) {
	graph, err := ParseBPMNXML(sampleBPMNXML)
	if err != nil {
		t.Fatalf("failed to parse: %v", err)
	}

	// 1. 从 StartEvent_1 推进，应到达 Activity_LeaderApproval
	nextNodes, err := graph.GetNextNodes("StartEvent_1", nil)
	if err != nil {
		t.Fatalf("unexpected error getting next nodes from start: %v", err)
	}
	if len(nextNodes) != 1 || nextNodes[0].ID != "Activity_LeaderApproval" {
		t.Fatalf("expected next node Activity_LeaderApproval, got %+v", nextNodes)
	}

	// 2. 从 Activity_LeaderApproval 推进，approved = true 时经过网关，应到达 Activity_ITOps
	nextPass, err := graph.GetNextNodes("Activity_LeaderApproval", map[string]interface{}{
		"approved": true,
	})
	if err != nil {
		t.Fatalf("unexpected error on pass: %v", err)
	}
	if len(nextPass) != 1 || nextPass[0].ID != "Activity_ITOps" {
		t.Fatalf("expected next node Activity_ITOps on pass, got %+v", nextPass)
	}

	// 3. 从 Activity_LeaderApproval 推进，approved = false 时经过网关，应到达 EndEvent_Rejected
	nextReject, err := graph.GetNextNodes("Activity_LeaderApproval", map[string]interface{}{
		"approved": false,
	})
	if err != nil {
		t.Fatalf("unexpected error on reject: %v", err)
	}
	if len(nextReject) != 1 || nextReject[0].ID != "EndEvent_Rejected" {
		t.Fatalf("expected next node EndEvent_Rejected on reject, got %+v", nextReject)
	}

	// 4. 从 Activity_ITOps 推进，应到达 EndEvent_Completed
	nextDone, err := graph.GetNextNodes("Activity_ITOps", nil)
	if err != nil {
		t.Fatalf("unexpected error on finish: %v", err)
	}
	if len(nextDone) != 1 || nextDone[0].ID != "EndEvent_Completed" {
		t.Fatalf("expected next node EndEvent_Completed, got %+v", nextDone)
	}
}

func TestParseBPMNXML_InvalidTopology(t *testing.T) {
	// 缺失 EndEvent
	invalidXML := `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <process id="P1">
    <startEvent id="S1"><outgoing>F1</outgoing></startEvent>
    <sequenceFlow id="F1" sourceRef="S1" targetRef="T1" />
    <userTask id="T1"><incoming>F1</incoming></userTask>
  </process>
</definitions>`

	_, err := ParseBPMNXML(invalidXML)
	if err == nil {
		t.Errorf("expected error for xml without endEvent, got nil")
	}
}
