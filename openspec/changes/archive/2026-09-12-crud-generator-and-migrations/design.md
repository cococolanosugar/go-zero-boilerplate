## Context

当前项目采用 go-zero 单网关微服务与 pnpm React 18 前端大仓结构。业务开发中，持久层遵循 `goctl model` 生成规约，微服务遵循 gRPC Proto 契约，统一网关遵循 `.api` 契约，前端基于 `@zero/api` 与 Ant Design 6.x / ProComponents 2.8.10 构建。

在现有机制下，研发人员开发新数据表功能时，需要手动串联多个工具与多个模块目录。同时，数据库版本变更仅有根目录下的单体 `init.sql`，缺少增量版本化迁移工具链。

## Goals / Non-Goals

**Goals:**
- 提供一站式跨平台指令 `just gen-crud <service> <table_name>`，从 MySQL 表结构直接生成后端 Model 分页扩展、Proto RPC 方法、Gateway RESTful 接口、前端 `@zero/api` SDK 以及 Ant Design ProTable 管理页面。
- 保证生成的前端代码严格符合 Ant Design 6.x 规范，无已废弃属性（如 `Card bordered`、`bodyStyle` 等），100% 通过 `just lint-antd` 静态检查。
- 基于 `atlas`（已在 `mise.toml` 中锁定）建立标准版本化迁移目录 `manifest/sql/migrations/`，提供 `migrate-new`、`migrate-up`、`migrate-down` 与 `migrate-status` 快捷指令。
- 保持向后兼容：为现有的 `manifest/sql/init.sql` 建立首个基线版本 `20260912000000_baseline.sql`。

**Non-Goals:**
- 不构建复杂的 Web 可视化低代码拖拽画布（坚持以 Git 与 DDL 驱动的代码生成，便于代码审查与团队版本协同）。
- 不破坏既有 RBAC、SSO 与数据权限中间件逻辑，生成代码天然继承切面防护。

## Decisions

### 1. 代码生成引擎技术选型：原生 Go 模板驱动 (`hack/generator`)
- **决策**：在 `hack/generator` 中使用 Go 标准库 `database/sql` 读取 MySQL `information_schema`，并结合 Go 原生 `text/template` 实现代码生成。
- **理由**：
  - 项目通过 `mise` 统一锁定了 Go 1.26.5 工具链，无需在开发者环境中额外依赖 Python 或重型 Node 外部库。
  - Go 强类型映射（MySQL Type -> Go Type -> Protobuf Type -> TypeScript Type）最为准确，且与 `goctl` 的风格完美契合。
- **备选方案**：
  - 纯 Bash/PowerShell 脚本：难以处理复杂的表元数据解析与模板语法；
  - Node.js 脚本：需在根目录安装额外 npm 依赖，破坏 Go 后端纯净度。

### 2. 字段类型与前端 ProTable 控件智能映射矩阵
- **映射规则**：
  - `bigint`, `int`, `tinyint(1)`:
    - 命名为 `status`, `is_*`, `type` 时：自动映射为 Ant Design ProTable 的 `valueType: 'select'` / `Tag` 状态徽章。
    - 其它整型：映射为 `valueType: 'digit'`。
  - `varchar`, `text`: 映射为 `valueType: 'text'`，超长文本在新建编辑表单中采用 `ProFormTextArea`。
  - `datetime`, `timestamp`: 映射为 `valueType: 'dateTime'`，筛选栏自动使用 `dateTimeRange` 区间选择器。
  - `decimal`, `float`, `double`: 映射为 `valueType: 'money'` 或 `digit`。

### 3. 持久层与契约融合机制 (IDL-First 串联)
- **步骤编排**：
  1. 调用 `goctl model mysql ddl` 生成底层实体 Model（已支持 Cache-Aside）；
  2. 生成自定义 Model 扩展文件 `internal/model/<entity>_model_custom.go`（实现真分页、动态 SQL 拼接与模糊查询）；
  3. 解析目标微服务的 `.proto` 文件，追加 CRUD 对应的 Message 与 RPC 方法，触发 `just gen-rpc <service>`；
  4. 解析网关 `desc/<service>.api` 追加路由契约，触发 `just gen-gateway`；
  5. 触发 `just gen-ts` 刷新前端 SDK；
  6. 输出 React 页面至 `frontend/apps/admin/src/pages/<Module>/index.tsx` 并提供路由挂载指引。

### 4. 数据库迁移引擎：基于 Atlas 声明式与版本化迁移
- **决策**：使用已在 `mise.toml` 中配置的 `atlas` CLI 工具管理 `manifest/sql/migrations/`。
- **理由**：`atlas` 是现代化 Go 生态中最成熟强大的开源数据库版本管理工具，支持 MySQL 语法检验、版本化（Versioned Migrations）、Schema 差异比对（Diff）与安全防破坏校验。

## Risks / Trade-offs

- **[风险 1] 目标文件覆盖冲突**：如果开发者之前已经对生成的文件做过手动调整，重复执行可能会覆盖自定义代码。
  - **缓解策略**：生成器在检测到目标文件已存在时默认提示确认，或支持 `--force` 参数；RPC 和 Gateway 采用追加注入（Append/Merge）模式而非简单覆盖。
- **[风险 2] 多环境迁移网络隔离**：容器化部署与本地直连数据库连接串不同。
  - **缓解策略**：迁移脚本统一读取 `DATABASE_URL` 环境变量，未设置时默认 fallback 到当前本地 Docker MySQL 端口 `127.0.0.1:3306`（root/root）。
- **[风险 3] 特殊数据类型（如 JSON、BLOB）映射失真**：
  - **缓解策略**：针对 JSON 字段生成 `string` 并附加序列化反序列化辅助注释。
