## Purpose

提供源码拉取、多语言环境隔离构建、容器镜像制作与镜像仓库制品推送的统一制品构建能力。

## ADDED Requirements

### Requirement: Source Code Checkout and Credential Binding
The system SHALL support pulling source code from Git repositories (GitHub, GitLab, Gitee, and self-hosted Git services) using bound credentials (SSH Keys or Personal Access Tokens).

#### Scenario: Checkout repository on pipeline execution
- **WHEN** a build step starts with a specified Git repository, commit hash, or branch
- **THEN** the system clones the source code into an isolated execution runner workspace using the configured credentials

### Requirement: Container Image Build and Packaging
The system SHALL support building container images using Dockerfile configurations within an isolated runner environment (via Kaniko or DinD) without requiring privileged host root access.

#### Scenario: Successful image build and packaging
- **WHEN** a container image build step executes with context path and build arguments
- **THEN** the system compiles the artifacts, produces the container image, and streams the build logs in real time

### Requirement: Artifact and Container Registry Push
The system SHALL support pushing built container images and versioned artifacts to target container registries (Harbor, ACR, SWR, ECR) with automated image tagging.

#### Scenario: Push image to target Harbor registry
- **WHEN** an image build succeeds and target registry credentials are provided
- **THEN** the system tags the image with semantic versioning (commit ID and timestamp) and pushes it to the registry, recording the full image URL in the build manifest
