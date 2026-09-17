## Purpose

提供外部 Jenkins 实例集群纳管、远程 Job 触发、执行日志实时收集与构建结果制品回传的统一集成桥梁。

## ADDED Requirements

### Requirement: Jenkins Instance and Credential Management
The system SHALL support registering external Jenkins instances with base URL, username, API token, and crumb issuer validation.

#### Scenario: Register a new Jenkins instance
- **WHEN** an administrator provides Jenkins URL, authentication credentials, and tests connectivity
- **THEN** the system verifies the remote Jenkins API connection and stores the integration entry with encrypted credentials

### Requirement: Remote Job Dispatch and Parameter Passing
The system SHALL support invoking configured Jenkins jobs as step nodes in a pipeline, passing pipeline runtime parameters (Git branch, commit, build target) to Jenkins Job parameters.

#### Scenario: Trigger remote Jenkins job in pipeline
- **WHEN** a pipeline execution reaches a Jenkins build step
- **THEN** the system triggers the specified Jenkins Job via REST API, captures the build queue ID and build number, and sets the step state to RUNNING

### Requirement: Streaming Log Collection and Status Synchronization
The system SHALL periodically poll and stream console logs from Jenkins until the job terminates, synchronizing the final build status and output image tags back to the pipeline.

#### Scenario: Synchronize Jenkins job completion
- **WHEN** the triggered Jenkins build completes with SUCCESS or FAILURE
- **THEN** the system captures the full console log, extracts generated artifact metadata or image tags, and updates the step status accordingly
