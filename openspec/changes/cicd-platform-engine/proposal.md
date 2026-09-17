## Why

在现代化微服务与云原生架构（如基于 `go-zero`、Docker 与 Kubernetes）的企业交付体系中，缺乏自主可控、统一高效的持续集成与持续交付（CI/CD）调度平台。现存开发交付流程面临以下痛点：
1. **多环境多微服务发布复杂度高**：随着微服务数量与应用端形态扩展，手动打包、手工推送镜像与手动 `kubectl apply` 容易导致配置漂移、环境不一致以及发布故障；
2. **异构工具链孤岛与遗留资产纳管难**：企业内部往往既有存量 Jenkins 生产流水线，又有面向 Kubernetes 原生容器化构建（Kaniko/BuildKit/Docker）的诉求，亟需一个对标 Zadig、Argo Workflows 的现代化自研/开源 DevOps 协同大盘，以实现同一控制面下对源码拉取、镜像制作、Jenkins 打包纳管与 Helm/YAML 多环境发布的端到端灵活编排。

引入统一的企业级 **Titan 研发交付平台（Titan DevOps Engine）**，将显著提升开发团队交付速度，实现自动化、可追溯、防越权的生产级交付闭环。

## What Changes

本方案将在项目中设计并落地企业级 **Titan 研发交付平台**（对标 Zadig 与现代化云原生 DevOps 平台体系）：

1. **核心架构设计与微服务划分**：
   - 设计并实现 `app/devops`（Titan 核心引擎）独立纯 gRPC 微服务（端口 `:8086`）作为 DevOps 领域执行核心，提供与既有 `user`、`worker`、`itsm` 微服务无缝集成的持久层与领域模型；
   - 统一由 `app/gateway` 提供标准化 HTTP RESTful BFF 接口，并经 `just gen-ts` 生成 `@zero/api` 强类型前端 SDK。
2. **源码构建与容器镜像制品制作 (`artifact-and-image-build`)**：
   - 支持多 Git 源（GitHub/GitLab/Gitee/自建私有源）凭据纳管、分支/Tag/Commit 触发；
   - 基于 Kubernetes 动态 Pod Runner 执行隔离编译构建（集成 Kaniko / BuildKit 无特权安全镜像制作，以及 DinD 模式）；
   - 支持多制品库集成（Harbor、阿里云 ACR、华为云 SWR、AWS ECR），自动打 Tag、版本记录与元数据关联。
3. **纳管 Jenkins 外部打包引擎 (`jenkins-integration-bridge`)**：
   - 支持纳管外部已有 Jenkins 实例集群（连接凭证、URL、Token、Crumb 验证）；
   - 支持在自定义流水线节点中将特定构建步骤委托给指定 Jenkins Job 执行，实时拉取 Streaming 日志、状态轮询与产物 Image Tag 回传。
4. **灵活自定义发布工作流引擎 (`cicd-pipeline-engine`)**：
   - 参考 Zadig 架构，提供基于 DAG（有向无环图）与分阶段（Stages & Steps）的工作流拓扑定义；
   - 支持参数化流水线、手动审批门禁卡点（可与项目已有 ITSM 审批流无缝串联）、Webhook 自动触发（Git Push/PR）；
   - 基于 Temporal 工作流长生命周期持久化保证，或者 Kubernetes CRD/Job 调度器实现抗单点故障、可断点重试与实时日志推送。
5. **K8s 多集群与 Helm / YAML 部署发布中心 (`k8s-release-management`)**：
   - 纳管外部与本地 Kubernetes 集群凭据（KubeConfig / ServiceAccount Token）；
   - 支持双模发布引擎：
     - **Helm 模式**：支持纳管 Helm Chart 仓库、动态渲染 Values.yaml、执行 `helm upgrade --install` 与版本回滚；
     - **原生 YAML 模式**：基于 Go 原生 client-go 动态客户端对 Deployment、Service、Ingress、ConfigMap 等资源进行模板渲染与精准增量 Apply；
   - 支持多环境（开发 dev、测试 test、预发 staging、生产 prod）隔离、健康检查检测与一键回滚。
6. **双端界面与可视化看板治理**：
   - **Admin 管理后台**：`/devops/pipelines`（可视化工作流编排器与执行看板）、`/devops/clusters`（K8s 集群与命名空间大盘）、`/devops/integrations`（Jenkins / Git / Harbor 凭据管理）；
   - **全量日志与制品跟踪**：实时 WebSocket / SSE 终端日志流、版本轨迹与制品审计。

## Capabilities

### New Capabilities
- `cicd-pipeline-engine`: 自定义 CI/CD 流水线引擎、DAG 阶段流转、步骤编排、参数化配置与执行控制。
- `artifact-and-image-build`: Git 源码检出、容器内隔离编译、安全镜像构建（Kaniko/Docker）与容器镜像仓库制品推送。
- `jenkins-integration-bridge`: 外部 Jenkins 实例凭据纳管、Job 关联与远程调度、实时日志捕获与状态同步。
- `k8s-release-management`: Kubernetes 多集群与多环境纳管、Helm Chart 模板渲染发布、原生 YAML 动态 Apply、发布健康度检测与版本回退。

### Modified Capabilities
（无现有能力行为变更，本特性为全新领域能力扩展）

## Impact

1. **后端微服务架构**：
   - 新增 `app/devops/rpc` 微服务（gRPC 端口 `:8086`）与 `app/devops/model` 持久层（流水线、步骤任务、执行记录、K8s集群、外部系统集成 5 张主表）；
   - 网关 `app/gateway/desc/devops.api` 暴露 RESTful BFF 接口；
   - `app/worker` 或 `pkg/temporalx` 承载长时间运行的 Pipeline 阶段状态机编排；
2. **前端与 SDK**：
   - `@zero/api` 增加 `devops` API 端点与模型；
   - `apps/admin` 新增 `/devops` 路由、流水线编排设计器、实时日志抽屉与多集群监控视图；
3. **基础设施与部署**：
   - `manifest/deploy` 与 `docker-compose` 增加 Harbor/Jenkins 快速集成配置与本地 K8s/k3s 联调文档；
   - `Makefile` 与 `justfile` 新增 `gen-devops-rpc` 与 `run-devops-rpc` 指令。
