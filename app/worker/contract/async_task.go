package contract

// Task queue constants
const (
	AsyncTaskQueueName = "ASYNC_TASK_QUEUE"
)

// Workflow names
const (
	DailyReportWorkflowName = "DailyReportWorkflow"
)

// Signal names
const (
	SignalCancelTask = "cancel-task"
	SignalPauseTask  = "pause-task"
	SignalResumeTask = "resume-task"
)

// Query names
const (
	QueryGetTaskStatus = "getTaskStatus"
)
