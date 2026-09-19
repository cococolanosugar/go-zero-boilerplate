## Purpose

提供企业级自定义 CI/CD 流水线编排引擎，支持多阶段 DAG 任务拓扑编排、参数化触发、门禁审批卡点与执行过程状态流转控制。

## ADDED Requirements

### Requirement: Pipeline Definition and DAG Topology
The system SHALL support defining CI/CD pipelines consisting of multiple sequential stages or directed acyclic graph (DAG) execution steps.

#### Scenario: User saves a pipeline configuration
- **WHEN** the user creates or updates a pipeline with stages including test, build, and deploy with dependencies
- **THEN** the system validates that there are no circular dependencies and persists the pipeline configuration successfully

### Requirement: Pipeline Execution and Parameterization
The system SHALL allow manual, schedule-based, or webhook-based execution of pipelines with customizable dynamic parameters (e.g., Git branch, target environment, image tag).

#### Scenario: Trigger pipeline with custom parameters
- **WHEN** the user triggers a pipeline execution specifying branch "release/v1.2" and target environment "staging"
- **THEN** the system creates a new pipeline execution record with status "RUNNING" and injects the specified parameters into all downstream steps

### Requirement: Manual Approval Gates
The system SHALL support configuring approval gates before critical stages (such as production deployments), pausing the execution until authorized users approve or reject the action.

#### Scenario: Pipeline pauses at production approval gate
- **WHEN** a pipeline execution reaches a stage requiring production deployment approval
- **THEN** the system transitions the execution status to "WAITING_APPROVAL" and dispatches a notification to authorized approvers

#### Scenario: Authorized approver approves stage
- **WHEN** an authorized approver submits an approval action with remarks
- **THEN** the system logs the approval decision and resumes pipeline execution to the next stage
