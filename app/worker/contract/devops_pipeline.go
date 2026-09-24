package contract

// Titan Pipeline 工作流与信号常量
const (
	TitanPipelineWorkflowName = "TitanPipelineWorkflow"
	SignalApproveStep         = "ApproveStepSignal"
	SignalCancelPipeline      = "CancelPipelineSignal"
)

type PipelineStepInput struct {
	StepID      string            `json:"stepId"`
	StepName    string            `json:"stepName"`
	StepType    string            `json:"stepType"` // GIT_CHECKOUT, KANIKO_BUILD, JENKINS_JOB, K8S_DEPLOY, HELM_DEPLOY, APPROVAL
	Config      map[string]string `json:"config"`
	StepExecID  int64             `json:"stepExecId"`
}

type PipelineStageInput struct {
	StageID   string              `json:"stageId"`
	StageName string              `json:"stageName"`
	Steps     []PipelineStepInput `json:"steps"`
}

type TitanPipelineInput struct {
	ExecID       int64                `json:"execId"`
	PipelineID   int64                `json:"pipelineId"`
	ExecNo       string               `json:"execNo"`
	GitBranch    string               `json:"gitBranch"`
	GitCommit    string               `json:"gitCommit"`
	Stages       []PipelineStageInput `json:"stages"`
	Params       map[string]string    `json:"params"`
	TimeoutMin   int                  `json:"timeoutMin"`
}

type StepApprovalSignal struct {
	StepID   string `json:"stepId"`
	Approved bool   `json:"approved"`
	Comment  string `json:"comment"`
	UserID   int64  `json:"userId"`
}
