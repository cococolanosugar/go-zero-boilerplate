## 1. 数据模型与微服务基础架构搭建

- [x] 1.1 编写 Titan 5 张核心数据表 DDL 迁移文件（`titan_integration`、`titan_cluster`、`titan_pipeline`、`titan_pipeline_exec`、`titan_pipeline_step_exec`）并生成持久层 Model 代码，通过 Model 单元测试验证基础 CRUD
- [x] 1.2 创建 `app/titan/rpc` 纯 gRPC 微服务骨架（`titan.proto`、`servicecontext`、`titan.go`、`etc/titan.yaml`），通过 `go build ./app/titan/rpc/...` 编译验证服务启动入口

## 2. 外部集成桥梁与凭证纳管

- [x] 2.1 实现敏感凭据（Git SSH Key/Token、Harbor、Jenkins API Token）AES-GCM 加密存储与解密读取工具库，编写单元测试验证加解密一致性
- [x] 2.2 实现 Jenkins REST Client 与远程调度 Logic，支持携带动态参数触发 Jenkins Job、增量捕获控制台日志与轮询状态，编写 Mock 单元测试验证调用流程

## 3. Kubernetes 多集群与 Helm / YAML 发布引擎

- [x] 3.1 基于 client-go 实现 K8s 集群凭证验证、API 连通性测试与命名空间动态发现 Logic，验证连接健康度状态更新
- [x] 3.2 基于 Helm Go SDK 实现 Chart 仓库拉取、动态 Values 参数覆盖渲染与 `helm upgrade --install` 发布逻辑，验证版本创建与回滚
- [x] 3.3 基于 client-go dynamic client 实现原生 YAML 模板变量替换、Dry-run 校验与 Server-Side Apply 发布引擎，验证 Pod 探针就绪度检查

## 4. 自定义流水线引擎与 Temporal 工作流编排

- [x] 4.1 在 `app/worker` 或 `app/titan` 中定义 `TitanPipelineWorkflow`，实现代码检出、容器镜像构建、Jenkins 委托、K8s 发布等 Activities 的 DAG 拓扑顺序调度
- [x] 4.2 实现手动审批门禁卡点逻辑（通过 Temporal Signal 机制接收审批/驳回信号），并实现超时中断与步骤失败重试策略，编写工作流集成测试验证

## 5. 统一网关接口与前端 TS SDK 生成

- [x] 5.1 编写 `app/gateway/desc/titan.api` 契约定义，声明流水线编排、集群纳管、凭证配置与执行控制的 RESTful 接口并在 `gateway.api` 引入
- [x] 5.2 运行 `just gen-gateway` 生成后端桩代码并在网关 Logic 中打通 Downstream RPC，运行 `just gen-ts` 生成 `@zero/api` 强类型客户端 SDK

## 6. 前端 Admin 可视化管理与终端日志流

- [x] 6.1 在 `apps/admin` 中实现 `/titan/integrations` 凭证管理与 `/titan/clusters` Kubernetes 集群治理页面，使用 ProTable 与 ProForm 验证交互
- [x] 6.2 在 `apps/admin` 中实现 `/titan/pipelines` 流水线编排设计器，支持阶段（Stages）与任务步骤（Steps）的可视化增删与参数配置
- [x] 6.3 在 `apps/admin` 中实现 `/titan/pipelines/exec/:id` 执行详情视图，包含步骤流转状态时间线、实时终端日志查看器与手动审批操作卡片

## 7. 全链路集成测试与工程化规范闭环

- [x] 7.1 编写微服务 RPC 与网关单元测试，执行 `go test ./app/titan/...` 确保测试 100% 通过
- [x] 7.2 编写前端组件自动化单元测试，执行 `pnpm test` 并在 `apps/admin` 中执行生产构建验证 0 错误
- [x] 7.3 在 `Makefile` 与 `justfile` 中补齐 `gen-titan-rpc` 与 `run-titan-rpc` 命令，并在 `AGENTS.md` 和 `README.md` 中更新 Titan 架构说明与命令速查
