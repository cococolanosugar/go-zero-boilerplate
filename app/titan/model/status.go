// Package model 中集中定义 Titan 全部资源状态枚举（单一真源）。
// 数据库默认值、种子数据与业务代码判断必须使用同一词汇表，
// 禁止在 logic 层散落魔法字符串。
package model

// 流水线执行状态 (titan_pipeline_exec.status / titan_pipeline_step_exec.status)
const (
	ExecStatusPending   = "PENDING"
	ExecStatusRunning   = "RUNNING"
	ExecStatusSuccess   = "SUCCESS"
	ExecStatusFailed    = "FAILED"
	ExecStatusAborted   = "ABORTED"
	ExecStatusSkipped   = "SKIPPED"
	ExecStatusCancelled = "CANCELLED"
)

// IsExecTerminal 判断执行状态是否为终态（终态后不可取消、日志拉取结束）
func IsExecTerminal(status string) bool {
	switch status {
	case ExecStatusSuccess, ExecStatusFailed, ExecStatusAborted, ExecStatusCancelled, ExecStatusSkipped:
		return true
	}
	return false
}

// IsStepTerminal 判断步骤执行状态是否为终态
func IsStepTerminal(status string) bool {
	return IsExecTerminal(status)
}

// 环境-应用绑定状态 (titan_env_app_binding.status)
const (
	BindingStatusPending   = "PENDING"   // 待部署
	BindingStatusDeploying = "DEPLOYING" // 部署中（幂等锁：部署进行中拒绝重复提交）
	BindingStatusRunning   = "RUNNING"   // 运行中
	BindingStatusFailed    = "FAILED"    // 部署失败
	BindingStatusStopped   = "STOPPED"   // 已停止
)

// 制品状态 (titan_artifact.status)
const (
	ArtifactStatusAvailable = "AVAILABLE"
	ArtifactStatusExpired   = "EXPIRED"
)

// 集群状态 (titan_cluster.status)
const (
	ClusterStatusHealthy   = "HEALTHY"
	ClusterStatusUnhealthy = "UNHEALTHY"
	ClusterStatusUnknown   = "UNKNOWN"
)

// 环境状态 (titan_env.status)
const (
	EnvStatusActive   = "ACTIVE"
	EnvStatusInactive = "INACTIVE"
)

// 应用/项目/集成/流水线通用启停状态 (tinyint: 1 启用 0 停用)
const (
	CommonStatusEnabled  = int64(1)
	CommonStatusDisabled = int64(0)
)
