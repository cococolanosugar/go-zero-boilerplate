## Why

在企业级中后台与业务微服务系统的快速迭代过程中，约 70% 的日常研发工作集中在基础业务实体的 CRUD（增删改查、条件筛选、分页展示、表单校验、权限受控）。当前脚手架虽然已打通底层链路，但新增一个业务表仍需分别手写 Model、手动修改 Proto、执行 `gen-rpc`、编写 RPC Logic、手动修改 API 契约、执行 `gen-gateway`、编写网关 Logic、执行 `gen-ts` 同步 SDK、并人工手写前端 ProTable 页面，耗时通常需要 2-4 小时且极易引入样板代码纰漏。

同时，数据库表结构的变更目前仅依赖单一的 `init.sql`，缺少版本化、可追踪、可回滚的迁移流水线（Database Migrations），导致多环境（开发、测试、预发、生产）之间极易产生 Schema 漂移与人为疏漏。

因此，第一阶段急需落地**全栈一体化 CRUD 自动化代码生成器**与**数据库版本化迁移工作流**，实现“单表 1 分钟完成全栈贯通”与“数据库变更 100% 版本受控”。

## What Changes

- **新增全栈一体化 CRUD 代码生成器 (`hack/scripts/gen-crud` & `just gen-crud <service> <table_name>`)**：
  - 逆向分析 MySQL 目标表的元数据（列名、数据类型、注释、是否允许 NULL、主键与唯一索引）；
  - **持久层 Model**：自动生成扩展 Model 文件，预置基于索引的防击穿缓存查询、动态多条件筛选、排序与真分页聚合；
  - **微服务 RPC**：自动在目标微服务的 `.proto` 中追加标准 CRUD 消息体（`CreateReq`, `UpdateReq`, `DeleteReq`, `GetReq`, `ListReq`）与 RPC 方法，并生成业务 Logic 桩代码；
  - **网关 BFF**：自动在网关 `desc/<service>.api` 中注册标准 RESTful 路由，生成网关 Handler / Logic 跨 RPC 聚合调用代码；
  - **前端 SDK**：联动执行 `just gen-ts` 自动同步前端强类型客户端；
  - **前端 ProTable 页面**：在 `apps/admin/src/pages/<Module>` 自动生成符合 Ant Design 6.x 与 ProComponents 规范的完整业务页面（包含多条件检索筛选、新建/编辑 Modal 表单、批量物理/逻辑删除、详情抽屉、权限按钮受控联动与国际化映射）。
- **建立数据库版本化迁移工作流 (Database Migrations)**：
  - 在 `manifest/sql/migrations/` 中建立增量 SQL 迁移版本库；
  - 集成 `atlas` / `goose` 迁移驱动，提供开箱即用的指令：
    - `just migrate-new <name>`：生成带标准时间戳的 UP / DOWN 迁移版本文件；
    - `just migrate-up`：执行未应用的迁移升级；
    - `just migrate-down`：安全回滚上一个迁移版本；
    - `just migrate-status`：查看多环境迁移同步状态；
  - 提取当前 `init.sql` 为 `20260912000000_baseline.sql` 初始基线，确保与生产/已有数据平滑兼容。

## Capabilities

### New Capabilities
- `crud-generator`: 全栈全自动代码生成工具，基于数据表逆向一键生成持久层 Model、微服务 RPC、网关 BFF、前端 SDK 与 Ant Design ProTable 页面。
- `database-migrations`: 基于版本化时间戳的数据库迁移流水线，支持向前升级、向后回滚、状态检查与多环境 Schema 防漂移。

### Modified Capabilities
<!-- 本次变更不修改既有已归档 capability 契约 -->

## Impact

- **后端体系**：
  - 新增 `hack/scripts/gen-crud.ps1` 与 `hack/scripts/gen-crud.sh` 跨平台生成脚本，并在 `justfile` 与 `Makefile` 中注册命令。
  - 新增基于 Go 的轻量级表元数据分析与模板引擎，统一代码生成标准。
- **持久层与配置**：
  - 在 `manifest/sql/` 下新增 `migrations/` 目录存放版本化 SQL。
  - 补充 `atlas.hcl` 或针对 `go-zero-mysql` 容器的迁移配置。
- **前端工程**：
  - 生成的前端页面遵循 Ant Design 6.x 语义化样式体系与 ProComponents 2.8.10 规范，保证 100% 通过 `just lint-antd` 与 `pnpm test`。
