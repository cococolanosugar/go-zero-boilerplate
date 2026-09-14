package contract

// ITSM SLA 工作流常量定义
const (
	ItsmSlaWorkflowName = "ItsmSlaMonitorWorkflow"
)

// ItsmSlaInput 工作流输入参数
type ItsmSlaInput struct {
	TicketId            int64  `json:"ticketId"`
	TicketNo            string `json:"ticketNo"`
	ResponseDurationSec int    `json:"responseDurationSec"`
	ResolveDurationSec  int    `json:"resolveDurationSec"`
}
