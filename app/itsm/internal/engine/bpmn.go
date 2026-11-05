package engine

import (
	"encoding/json"
	"encoding/xml"
	"errors"
	"fmt"
	"strings"
)

// BPMN 节点常量
const (
	ElementTypeStartEvent       = "startEvent"
	ElementTypeEndEvent         = "endEvent"
	ElementTypeUserTask         = "userTask"
	ElementTypeExclusiveGateway = "exclusiveGateway"
	ElementTypeParallelGateway  = "parallelGateway"
	ElementTypeSequenceFlow     = "sequenceFlow"
)

// ProcessGraph 经过拓扑解析的 BPMN 流程图对象
type ProcessGraph struct {
	ProcessID   string
	ProcessName string
	StartNode   *BPMNNode
	Nodes       map[string]*BPMNNode
	Flows       map[string]*BPMNFlow
}

// BPMNNode 抽象流程节点
type BPMNNode struct {
	ID               string
	Name             string
	Type             string // startEvent, endEvent, userTask, exclusiveGateway, parallelGateway
	IncomingFlow     []string
	OutgoingFlow     []string
	ApprovalMode     string            // SINGLE, COUNTER_SIGN, OR_SIGN
	CandidateRoles   []string          // e.g. ["ROLE_ADMIN"]
	CandidateUsers   []int64           // e.g. [1, 2]
	PassRate         int               // 0-100
	FieldPermissions map[string]string // 字段权限映射
	Extensions       map[string]string // 自定义扩展属性键值
}

// BPMNFlow 流程流转连线
type BPMNFlow struct {
	ID        string
	Name      string
	SourceRef string
	TargetRef string
	Condition string // 分支条件表达式，例如: ${approved == true}
}

// XML 解析结构体
type xmlDefinitions struct {
	XMLName xml.Name   `xml:"definitions"`
	Process xmlProcess `xml:"process"`
}

type xmlProcess struct {
	ID                string                `xml:"id,attr"`
	Name              string                `xml:"name,attr"`
	StartEvents       []xmlStartEvent       `xml:"startEvent"`
	EndEvents         []xmlEndEvent         `xml:"endEvent"`
	UserTasks         []xmlUserTask         `xml:"userTask"`
	ExclusiveGateways []xmlExclusiveGateway `xml:"exclusiveGateway"`
	ParallelGateways  []xmlParallelGateway  `xml:"parallelGateway"`
	SequenceFlows     []xmlSequenceFlow     `xml:"sequenceFlow"`
}

type xmlStartEvent struct {
	ID       string   `xml:"id,attr"`
	Name     string   `xml:"name,attr"`
	Outgoing []string `xml:"outgoing"`
}

type xmlEndEvent struct {
	ID       string   `xml:"id,attr"`
	Name     string   `xml:"name,attr"`
	Incoming []string `xml:"incoming"`
}

type xmlUserTask struct {
	ID            string             `xml:"id,attr"`
	Name          string             `xml:"name,attr"`
	Incoming      []string           `xml:"incoming"`
	Outgoing      []string           `xml:"outgoing"`
	Documentation []xmlDocumentation `xml:"documentation"`
}

type xmlDocumentation struct {
	Text string `xml:",chardata"`
}

type xmlExclusiveGateway struct {
	ID       string   `xml:"id,attr"`
	Name     string   `xml:"name,attr"`
	Incoming []string `xml:"incoming"`
	Outgoing []string `xml:"outgoing"`
}

type xmlParallelGateway struct {
	ID       string   `xml:"id,attr"`
	Name     string   `xml:"name,attr"`
	Incoming []string `xml:"incoming"`
	Outgoing []string `xml:"outgoing"`
}

type xmlSequenceFlow struct {
	ID                  string `xml:"id,attr"`
	Name                string `xml:"name,attr"`
	SourceRef           string `xml:"sourceRef,attr"`
	TargetRef           string `xml:"targetRef,attr"`
	ConditionExpression string `xml:"conditionExpression"`
}

// ParseBPMNXML 解析 BPMN 2.0 XML 并构建与校验流程图拓扑
func ParseBPMNXML(xmlContent string) (*ProcessGraph, error) {
	if strings.TrimSpace(xmlContent) == "" {
		return nil, errors.New("bpmn xml content is empty")
	}

	var def xmlDefinitions
	if err := xml.Unmarshal([]byte(xmlContent), &def); err != nil {
		return nil, fmt.Errorf("failed to parse bpmn xml: %w", err)
	}

	proc := def.Process
	if proc.ID == "" && len(proc.StartEvents) == 0 && len(proc.UserTasks) == 0 {
		return nil, errors.New("no executable process definition found in bpmn xml")
	}

	graph := &ProcessGraph{
		ProcessID:   proc.ID,
		ProcessName: proc.Name,
		Nodes:       make(map[string]*BPMNNode),
		Flows:       make(map[string]*BPMNFlow),
	}

	// 1. 提取连线
	for _, f := range proc.SequenceFlows {
		graph.Flows[f.ID] = &BPMNFlow{
			ID:        f.ID,
			Name:      f.Name,
			SourceRef: f.SourceRef,
			TargetRef: f.TargetRef,
			Condition: strings.TrimSpace(f.ConditionExpression),
		}
	}

	// 2. 提取 StartEvents
	for _, s := range proc.StartEvents {
		node := &BPMNNode{
			ID:           s.ID,
			Name:         s.Name,
			Type:         ElementTypeStartEvent,
			OutgoingFlow: s.Outgoing,
			Extensions:   make(map[string]string),
		}
		graph.Nodes[s.ID] = node
		if graph.StartNode == nil {
			graph.StartNode = node
		}
	}

	// 3. 提取 EndEvents
	for _, e := range proc.EndEvents {
		graph.Nodes[e.ID] = &BPMNNode{
			ID:           e.ID,
			Name:         e.Name,
			Type:         ElementTypeEndEvent,
			IncomingFlow: e.Incoming,
			Extensions:   make(map[string]string),
		}
	}

	// 4. 提取 UserTasks
	for _, u := range proc.UserTasks {
		node := &BPMNNode{
			ID:               u.ID,
			Name:             u.Name,
			Type:             ElementTypeUserTask,
			IncomingFlow:     u.Incoming,
			OutgoingFlow:     u.Outgoing,
			ApprovalMode:     "SINGLE",
			FieldPermissions: make(map[string]string),
			Extensions:       make(map[string]string),
		}

		if len(u.Documentation) > 0 {
			rawText := strings.TrimSpace(u.Documentation[0].Text)
			if strings.HasPrefix(rawText, "{") && strings.HasSuffix(rawText, "}") {
				var docData struct {
					AssigneeType     string            `json:"assigneeType"`
					CandidateRoles   []string          `json:"candidateRoles"`
					CandidateUsers   []int64           `json:"candidateUsers"`
					ApprovalMode     string            `json:"approvalMode"`
					PassRate         int               `json:"passRate"`
					FieldPermissions map[string]string `json:"fieldPermissions"`
				}
				if err := json.Unmarshal([]byte(rawText), &docData); err == nil {
					if docData.ApprovalMode != "" {
						node.ApprovalMode = docData.ApprovalMode
					}
					node.CandidateRoles = docData.CandidateRoles
					node.CandidateUsers = docData.CandidateUsers
					node.PassRate = docData.PassRate
					if docData.FieldPermissions != nil {
						node.FieldPermissions = docData.FieldPermissions
					}
				}
			}
		}

		graph.Nodes[u.ID] = node
	}

	// 5. 提取 Gateways
	for _, g := range proc.ExclusiveGateways {
		graph.Nodes[g.ID] = &BPMNNode{
			ID:           g.ID,
			Name:         g.Name,
			Type:         ElementTypeExclusiveGateway,
			IncomingFlow: g.Incoming,
			OutgoingFlow: g.Outgoing,
			Extensions:   make(map[string]string),
		}
	}
	for _, g := range proc.ParallelGateways {
		graph.Nodes[g.ID] = &BPMNNode{
			ID:           g.ID,
			Name:         g.Name,
			Type:         ElementTypeParallelGateway,
			IncomingFlow: g.Incoming,
			OutgoingFlow: g.Outgoing,
			Extensions:   make(map[string]string),
		}
	}

	// 6. 拓扑校验
	if err := graph.Validate(); err != nil {
		return nil, err
	}

	return graph, nil
}

// Validate 校验流程图连通性与完整性
func (g *ProcessGraph) Validate() error {
	if g.StartNode == nil {
		return errors.New("bpmn process must have at least one startEvent")
	}

	hasEnd := false
	for _, node := range g.Nodes {
		if node.Type == ElementTypeEndEvent {
			hasEnd = true
			break
		}
	}
	if !hasEnd {
		return errors.New("bpmn process must have at least one endEvent")
	}

	// 校验所有连线的 Source 与 Target 是否均有效存在
	for flowID, flow := range g.Flows {
		if _, ok := g.Nodes[flow.SourceRef]; !ok {
			return fmt.Errorf("flow %s references non-existing source node %s", flowID, flow.SourceRef)
		}
		if _, ok := g.Nodes[flow.TargetRef]; !ok {
			return fmt.Errorf("flow %s references non-existing target node %s", flowID, flow.TargetRef)
		}
	}

	return nil
}

// GetNextNodes 给定当前节点和流转变量，计算后续激活节点
func (g *ProcessGraph) GetNextNodes(currentNodeID string, vars map[string]interface{}) ([]*BPMNNode, error) {
	node, exists := g.Nodes[currentNodeID]
	if !exists {
		return nil, fmt.Errorf("node %s not found in process graph", currentNodeID)
	}

	if node.Type == ElementTypeEndEvent {
		return nil, nil // 已到达终点
	}

	var results []*BPMNNode
	for _, flowID := range node.OutgoingFlow {
		flow, ok := g.Flows[flowID]
		if !ok {
			continue
		}

		targetNode, exists := g.Nodes[flow.TargetRef]
		if !exists {
			continue
		}

		// 若目标是排他网关 (ExclusiveGateway)，需递归计算其出口
		if targetNode.Type == ElementTypeExclusiveGateway {
			gwNext, err := g.evaluateExclusiveGateway(targetNode, vars)
			if err != nil {
				return nil, err
			}
			results = append(results, gwNext...)
		} else {
			// 普通节点或连线条件评估
			if flow.Condition != "" {
				matched, err := evaluateCondition(flow.Condition, vars)
				if err != nil || !matched {
					continue
				}
			}
			results = append(results, targetNode)
		}
	}

	return results, nil
}

// evaluateExclusiveGateway 计算排他网关的分支选择（命中首个满足条件的流向）
func (g *ProcessGraph) evaluateExclusiveGateway(gwNode *BPMNNode, vars map[string]interface{}) ([]*BPMNNode, error) {
	var defaultTarget *BPMNNode

	for _, flowID := range gwNode.OutgoingFlow {
		flow, ok := g.Flows[flowID]
		if !ok {
			continue
		}
		targetNode, exists := g.Nodes[flow.TargetRef]
		if !exists {
			continue
		}

		// 无条件连线作为默认流
		if flow.Condition == "" {
			defaultTarget = targetNode
			continue
		}

		matched, err := evaluateCondition(flow.Condition, vars)
		if err == nil && matched {
			return []*BPMNNode{targetNode}, nil
		}
	}

	if defaultTarget != nil {
		return []*BPMNNode{defaultTarget}, nil
	}

	return nil, fmt.Errorf("no matching sequence flow found for exclusive gateway %s", gwNode.ID)
}

// evaluateCondition 基础表达式条件判断 (支持 approved == true / approved == false / status == 'xxx')
func evaluateCondition(expr string, vars map[string]interface{}) (bool, error) {
	clean := strings.TrimSpace(expr)
	clean = strings.TrimPrefix(clean, "${")
	clean = strings.TrimSuffix(clean, "}")
	clean = strings.TrimSpace(clean)

	if clean == "" || clean == "true" {
		return true, nil
	}
	if clean == "false" {
		return false, nil
	}

	parts := strings.Split(clean, "==")
	if len(parts) == 2 {
		key := strings.TrimSpace(parts[0])
		val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)

		actual, ok := vars[key]
		if !ok {
			return false, nil
		}
		actualStr := fmt.Sprintf("%v", actual)
		return actualStr == val, nil
	}

	parts = strings.Split(clean, "!=")
	if len(parts) == 2 {
		key := strings.TrimSpace(parts[0])
		val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)

		actual, ok := vars[key]
		if !ok {
			return true, nil
		}
		actualStr := fmt.Sprintf("%v", actual)
		return actualStr != val, nil
	}

	return false, fmt.Errorf("unsupported condition expression: %s", expr)
}
