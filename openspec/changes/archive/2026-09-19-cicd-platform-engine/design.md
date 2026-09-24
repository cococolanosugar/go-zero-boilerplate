## Context

本项目为基于 go-zero 的工业级微服务 Monorepo 全栈大仓，统一 HTTP 网关（`app/gateway`）作为唯一公网入口，内部各服务（`user`、`worker`、`itsm`）均为纯 gRPC 微服务。此外，系统已深度集成了 Temporal 分布式工作流引擎（`pkg/temporalx` 与 `app/worker`），具备长时间运行状态机编排、超时控制、Saga 补偿与信号交互能力。

在 DevOps 与 CI/CD 领域，开源标杆 **Zadig**（https://github.com/koderover/zadig）以云原生交付、灵活自定义工作流、多环境部署为核心特色，深受企业青睐。本设计参考 Zadig 的工作流解耦模型与架构思想，在本项目全栈体系内构建 **Titan 研发交付平台（Titan DevOps Engine）**，打造企业级基石型 CI/CD 与多环境发布调度中枢。

## Goals / Non-Goals

**Goals:**
- **架构解耦与职责收敛**：新增 `app/titan/rpc`（Titan 微服务核心，gRPC :8086）独立微服务，承载 Titan 领域规则与数据持久化，网关仅做路由聚合；
- **Zadig 式自定义工作流 (Custom Pipeline)**：支持自由组合多阶段（Stages）与多任务步骤（Steps），包括源码检出、构建脚本、Docker/Kaniko 镜像制作、Jenkins Job 调度、K8s YAML 发布、Helm Chart 发布与人工审批门禁；
- **分布式高可靠编排**：利用项目已有的 Temporal 引擎（`app/worker`）调度长周期工作流执行，支持断点续跑、失败重试、超时控制与实时状态上报；
- **Jenkins 双向桥接**：无缝纳管企业既有 Jenkins 集群，支持参数化触发 Job、增量拉取控制台日志流及镜像产物回传；
- **K8s 多环境多发布模式**：纳管多 Kubernetes 集群凭证（KubeConfig），原生支持 Helm Chart 仓库渲染与 Kubernetes 原生 YAML Server-Side Apply 发布与一键回退；
- **现代化可视化体验**：管理后台提供流水线 DAG 拓扑编排、执行状态看板、实时终端日志流展示（Log Streaming）。

**Non-Goals:**
- 不自研底层容器运行时（Container Runtime），基于标准的 Docker/Kaniko/Kubernetes API 交互；
- 不自研代码托管仓库，直接对接标准 Git 协议（GitHub/GitLab/Gitee/自建私有 Git）；
- 不做重型分布式监控告警系统，仅针对发布工作流的执行健康度与 Pod 探针做就绪度检查。

## Decisions

### 1. 微服务职责划分与网关契约
- **决策**：新建 `app/titan/rpc` 纯 gRPC 服务（端口 8086），网关 `app/gateway/desc/titan.api` 暴露标准 RESTful API；前端通过 `just gen-ts` 生成 `@zero/api` 强类型调用函数。
- **替代方案考虑**：
  - *方案 B：直接在 gateway 中直连 K8s 与 Jenkins*。被否决，严重违反本项目“网关严禁直连外部基础设施与数据源，仅当下游 RPC 聚合层”的架构铁律。

### 2. 状态机与工作流调度引擎选型
- **决策**：工作流持久化与异步编排依托项目中既有的 **Temporal** 引擎（`app/worker` + `pkg/temporalx`）。
- **架构原理**：
  - 将一次 Pipeline 运行映射为一个 Temporal Workflow (`TitanPipelineWorkflow`)；
  - 每一个 Step 映射为一个 Temporal Activity（如 `GitCheckoutActivity`、`KanikoBuildActivity`、`JenkinsTriggerActivity`、`K8sDeployActivity`）；
  - 人工审批门禁通过 Temporal Signal（`ApproveSignal` / `RejectSignal`）进行异步唤醒。
- **替代方案考虑**：
  - *方案 A：自研 Goroutine + MySQL 状态轮询*。无法容忍 Worker 崩溃重启，丢失内存状态，重试与超时控制代码极其脆弱。
  - *方案 B：完全依赖 Kubernetes Tekton Pipelines*。Tekton CRD 过重，对轻量级开发环境与非 K8s 本地环境极不友好。

### 3. 安全镜像构建模式 (In-Cluster Build)
- **决策**：双模支持：
  1. **Kaniko 模式（默认推荐）**：在 Kubernetes 集群内启动临时 Pod，执行 Kaniko executor，无需 Docker daemon 与 root 特权，安全可靠；
  2. **Jenkins 委托模式**：将镜像制作任务委派给既有 Jenkins 节点（复用企业已有 Docker/DinD 物理基础设施）。
- **替代方案考虑**：
  - *直接挂载宿主机 `/var/run/docker.sock`*：存在严重安全逃逸隐患，不符合企业级生产规范。

### 4. Kubernetes 部署双引擎 (Helm vs YAML)
- **决策**：采用 Go 原生 SDK 双模驱动：
  - **Helm 模式**：通过 `helm.sh/helm/v3/pkg/action` SDK 直接在后端执行 Chart 打包、Values 变量覆盖（`helm upgrade --install`）与版本查询；
  - **原生 YAML 模式**：通过 `k8s.io/client-go` 的 `dynamic.Interface` 与 `discovery.DiscoveryClient`，支持任意 GVK 资源的 Server-Side Apply（基于 SSA 消除并发冲突）。

### 5. 数据模型设计 (5 张核心数据表)
1. `titan_integration`：集成配置表（Jenkins、Harbor/ACR、Git 凭据，敏感凭据 AES-GCM 加密存储）；
2. `titan_cluster`：Kubernetes 集群表（集群名称、环境标识、API Endpoint、KubeConfig 密文、状态）；
3. `titan_pipeline`：流水线定义表（项目 ID、流水线名称、触发方式、阶段与步骤编排 DSL JSON）；
4. `titan_pipeline_exec`：流水线运行记录表（执行编号、触发人、Git 分支/Commit、全局参数、运行状态、耗时、产物列表）；
5. `titan_pipeline_step_exec`：步骤执行记录表（对应 Activity、步骤类型、状态、开始/结束时间、日志存储路径/Offset）。

## Risks / Trade-offs

- **[构建日志海量与并发写性能风险]** → **缓解方案**：构建执行日志不直接全量写入 MySQL 文本字段，而是以流式日志块（Chunk）存储在本地日志文件或通用存储服务（`pkg/storage`）中，前端通过 WebSocket 或增量拉取（`offset`）分片消费。
- **[外部 Jenkins 网络抖动与响应超时]** → **缓解方案**：在 Jenkins Activity 中设置指数退避重试（Exponential Backoff），并在超时后自动将步骤标记为 FAILED 并释放排队锁。
- **[Kubernetes 集群发布权限越权]** → **缓解方案**：纳管 K8s 集群凭证时支持只赋予指定命名空间（Namespace）的 RBAC角色，发布时严格校验目标 Namespace 与集群是否在授权清单内。

## Migration Plan

1. 执行数据库迁移脚本（通过 `just migrate-new` 生成 `create_titan_tables` 并执行 `just migrate-up`）；
2. 启动 `titan-rpc` 微服务并在 Nacos/直连配置中挂载至网关 `etc/gateway.yaml`；
3. 执行 `just gen-gateway` 与 `just gen-ts` 保持全栈契约同步；
4. 部署 `admin` 前台 `/titan` 路由组件，并验证 Jenkins 与 K8s 集群连通性。
