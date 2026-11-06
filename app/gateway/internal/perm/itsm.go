package perm

const (
	// 流程定义
	ItsmProcessDefList   = "itsm:process_def:list"
	ItsmProcessDefCreate = "itsm:process_def:create"
	ItsmProcessDefDeploy = "itsm:process_def:deploy"

	// 工单流转
	ItsmTicketList     = "itsm:ticket:list"
	ItsmTicketCreate   = "itsm:ticket:create"
	ItsmTicketDetail   = "itsm:ticket:detail"
	ItsmTicketApprove  = "itsm:ticket:approve"
	ItsmTicketReject   = "itsm:ticket:reject"
	ItsmTicketTransfer = "itsm:ticket:transfer"
	ItsmTicketCancel   = "itsm:ticket:cancel"

	// 服务等级协议 SLA
	ItsmSlaList   = "itsm:sla:list"
	ItsmSlaUpdate = "itsm:sla:update"
)

func init() {
	RegisterGroup("itsm", "ITSM 服务流程", []Item{
		{Code: ItsmProcessDefList, Name: "查询流程定义"},
		{Code: ItsmProcessDefCreate, Name: "创建流程定义"},
		{Code: ItsmProcessDefDeploy, Name: "部署流程定义"},
		{Code: ItsmTicketList, Name: "工单工作台列表"},
		{Code: ItsmTicketCreate, Name: "提交申报工单"},
		{Code: ItsmTicketDetail, Name: "查看工单详情"},
		{Code: ItsmTicketApprove, Name: "审批通过工单"},
		{Code: ItsmTicketReject, Name: "驳回工单任务"},
		{Code: ItsmTicketTransfer, Name: "转办工单任务"},
		{Code: ItsmTicketCancel, Name: "撤销工单申请"},
		{Code: ItsmSlaList, Name: "查询 SLA 策略"},
		{Code: ItsmSlaUpdate, Name: "修改 SLA 策略"},
	})
}
