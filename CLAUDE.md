# CLAUDE.md - Development & Architecture Guide

本文档为 Claude 及其他 AI 编程助手提供 `go-zero-boilerplate` 项目的开发指导、架构规范、命令速查与微服务扩展流程。内容与 `AGENTS.md` 保持完全一致与互补。

---

## 1. 项目概览 (Project Overview)

* **项目名称**：`go-zero-boilerplate`
* **架构模式**：**Fullstack Monorepo 全栈大仓（统一网关微服务 + pnpm workspace 多端前端）**
* **后端框架**：[go-zero](https://github.com/zeromicro/go-zero) (v1.10.3)
* **前端框架**：React 18 + Vite + TypeScript + pnpm workspace（UI 库：Ant Design 6.6.2 & Ant Design Pro Components 2.8.10）
* **网络与通信规范**：
  * **仅 `app/gateway` 对外暴露 HTTP RESTful API**（端口 8888），作为唯一的流量入口与 BFF 层。
  * **内部所有业务微服务（`user`、`order` 等）仅暴露 gRPC 接口**，不对外提供直接的 HTTP 访问。
  * **前端各端应用（`admin`、`portal`）统一经由 `@zero/api` SDK 调用网关**。

---

## 2. 工具链与环境准备 (Toolchain & Environment)

本项目采用 [`mise.toml`](./mise.toml) 统一锁定全团队开发工具与版本：
* **Go**：1.26.5
* **Node**：24.18.0
* **pnpm**：11.17.0
* **goctl**：1.10.2
* **protoc**：35.1
* **just**：1.57.0
* **protoc-gen-go**：1.36.12
* **protoc-gen-go-grpc**：1.6.2
* **atlas**：1.3.0（全平台通用，声明式 DB Schema 管理与 DDL Diff）
* **skeema**：1.14.1（仅在 Linux / macOS 自动安装，Windows 建议通过 Docker 运行）
* **mcp-zero**：1.0.0（go-zero 官方 Model Context Protocol 服务）
* **@ant-design/cli**：6.6.2（前端 Ant Design 6 离线知识库、API 查询与 lint 工具）
* **@colbymchenry/codegraph**：1.6.0（代码 AST 知识图谱与调用追踪 MCP 服务）
* **gitnexus**：1.6.11（代码全景与变更影响面评估 MCP 服务）

### 一键初始化开发环境
```bash
# 信任并安装所有指定版本的开发工具
mise trust
mise install
```

---

## 3. 仓库目录结构规范 (Repository Layout)

```text
go-zero-boilerplate/
├── app/                           # 【后端 Go 微服务体系】
│   ├── gateway/                   # 统一对外 HTTP 网关 / BFF 服务 (端口 8888)
│   │   ├── desc/                  # 模块化 API 契约定义 (gateway.api, user.api, order.api)
│   │   ├── etc/                   # 网关配置文件 (gateway.yaml)
│   │   ├── internal/              # 网关内部实现 (config, handler, logic, svc, types)
│   │   └── gateway.go             # 网关启动 main 入口
│   │
│   ├── user/                      # 【用户微服务】纯 gRPC (端口 8080)
│   │   ├── rpc/
│   │   │   ├── client/user/       # 供网关调用的 RPC Client
│   │   │   ├── etc/user.yaml
│   │   │   ├── internal/
│   │   │   ├── pb/ & user.proto
│   │   │   └── user.go
│   │   └── model/
│   │
│   └── worker/                    # 【异步任务微服务】纯 gRPC (端口 8082，内置 Temporal Worker)
│       ├── contract/              # 跨服务公共工作流契约（任务队列、信号、状态结构）
│       └── rpc/
│           ├── client/worker/     # 供网关调用的 RPC Client
│           ├── etc/worker.yaml
│           ├── internal/          # activities, workflows, config, logic, server, svc
│           ├── pb/ & worker.proto
│           └── worker.go          # Worker RPC + Temporal 统一启动入口
│
├── frontend/                      # 【前端多端工程体系】pnpm workspace
│   ├── apps/
│   │   ├── admin/                 # 管理后台系统 (Vite + TS，端口 3001)
│   │   └── portal/                # 官方门户系统 (Vite + TS，端口 3000)
│   ├── packages/
│   │   ├── api/                   # 【共享 API SDK】通过 goctl api ts 自动从网关契约生成 (@zero/api)
│   │   └── shared/                # 跨前端应用共享的工具与常量 (@zero/shared)
│   ├── package.json               # 根 package.json
│   ├── pnpm-workspace.yaml        # 工作区配置
│   └── tsconfig.base.json         # 共享 TypeScript 配置
│
├── pkg/                           # 跨模块全局公共库（禁止引入任何 app 业务代码）
│   ├── result/                    # 统一 HTTP 返回结构封装（HttpResult / ParamErrorResult）
│   └── xerr/                      # 业务错误码与 CodeError 统一抽象
│
├── manifest/                      # 【交付与部署清单】
│   └── deploy/                    # 部署与运维资源 (docker-compose 等)
├── hack/                          # 【开发与运维辅助工具集】
│   └── scripts/                   # 跨平台代码生成辅助脚本（.ps1 与 .sh）
├── mise.toml                      # 全栈工具链与版本锁（Go, Node, pnpm, goctl, protoc, just 等）
├── justfile                       # Just 命令配置文件
├── Makefile                       # Make 命令配置文件
├── go.mod                         # 全局 Go 依赖管理
└── README.md                      # 项目使用指南
```

---

## 4. 架构原则与编码准则 (Architecture Rules & Guidelines)

### 4.1 职责边界防护
* **内部微服务禁开 HTTP**：业务微服务只保留 `rpc/` 和 `model/`，杜绝随意对外暴露端口。
* **Go `internal` 机制防护**：任何服务不得绕过 RPC 直接 import 另一个模块的 `internal/` 或 `model/`。
* **服务间 RPC 调用模式**：跨服务调用必须 import 目标服务的自动生成客户端：
  ```go
  import userClient "go-zero-boilerplate/app/user/rpc/client/user"
  import orderClient "go-zero-boilerplate/app/order/rpc/client/order"
  ```
* **网关核心职责**：仅负责“路由分发、参数校验、JWT 鉴权、跨 RPC 数据聚合”。**严禁在网关 Logic 中直连数据库或编写核心业务规则**，核心业务必须在各自微服务的 RPC Logic 中闭环。

### 4.2 统一响应与错误体系
* 网关 Handler 层必须使用 `pkg/result` 进行标准化输出：
  * **成功响应**：`result.HttpResult(r, w, resp, nil)` -> 输出格式：
    ```json
    { "code": 200, "msg": "SUCCESS", "data": { ... } }
    ```
  * **参数错误**：`result.ParamErrorResult(r, w, err)` -> HTTP 400。
  * **业务自定义错误**：返回 `xerr.NewErrCode(xerr.UserNotFound)` 或 `xerr.NewCodeError(code, msg)`。
  * **跨 RPC 错误传递**：`pkg/result/httpResult.go` 会自动从 gRPC status 中提取错误信息统一返回。

### 4.3 全栈契约驱动开发 (IDL First)
* **新增/修改 HTTP 接口与前端同步**：
  1. 在 `app/gateway/desc/<module>.api` 中增删路由。
  2. 若为新模块，在 `app/gateway/desc/gateway.api` 中 `import "<module>.api"`。
  3. 执行 `just gen-gateway` 生成后端网关桩代码。
  4. 执行 `just gen-ts` **自动生成前端 `@zero/api` SDK**，前端即可直接享用强类型的调用函数。
* **新增/修改微服务 RPC 接口**：
  1. 在 `app/<service>/rpc/<service>.proto` 中增删 RPC 方法。
  2. 执行 `just gen-rpc <service>`（或 `make gen-<service>-rpc`）。

### 4.4 依赖注入 (DI)
* 所有外部依赖（RPC 客户端、数据库句柄、Redis 客户端、配置）必须挂载在各服务的 `svc.ServiceContext` 中。
* 严禁在 package 级别声明全局变量持有连接句柄。

### 4.5 后端业务 Logic 与持久层 Model 编码深度规范 (基于 ai-context & zero-skills)
为保证 Claude 与开发者生成的后端代码具备生产级工程质量，必须严格遵守以下 Logic 与 Model 编写铁律：

#### 1. 业务 Logic 层守则 (Logic Layer Guardrails)
* **Context 绝对第一公民**：Logic 方法入参必须严格贯穿上下文，所有的 RPC Client 调用、Model 增删改查、Redis 缓存操作、并发任务派发均必须传入 `l.ctx`，保证链路追踪（Trace ID）与超时取消（Cancel Propagation）生效。
* **统一错误返回**：严禁在 Logic 中使用裸 `fmt.Errorf` 或随意返回无状态字符串。必须返回 `xerr.NewErrCode(xerr.xxx)` 或 `xerr.NewCodeError(code, msg)`。
* **职责边界隔离**：
  * **网关 Logic 严禁直连持久层**：网关 Logic **绝对禁止**直连数据库或持有任何 SQL/Cache 句柄！网关 Logic 只允许调用下游 RPC 客户端。当需要跨服务组装聚合数据时，必须使用 `mr.Finish(func() error { ... }, ...)` 进行并发请求，提升接口吞吐量。
  * **微服务 RPC Logic 闭环领域规则**：微服务内部 Logic 承载核心领域规则，通过 `l.svcCtx.<Entity>Model` 调用持久层，严禁在 Logic 内直接手拼 Raw SQL。

#### 2. 持久层 Model 编码守则 (Model Layer Guardrails)
* **Schema 驱动自动化生成**：数据表结构变更必须由 MySQL DDL 驱动，严禁人工手写结构体映射。统一执行：
  ```bash
  goctl model mysql ddl -src <schema.sql> -dir ./model -c --style go_zero
  ```
* **Cache-Aside 强一致性规范**：
  * 单行记录查询优先命中 Redis 缓存；更新（`Update`）与物理/逻辑删除（`Delete`）必须走 `CachedConn`，底层会自动处理先更新数据库、再精准淘汰缓存 Key。
  * 禁止在业务代码中随意手动拼写 `redis.Set/Del` 来更新实体缓存，避免缓存雪崩与双写不一致。
* **复杂查询与事务隔离**：
  * **自定义 SQL 查询**：多表 Join 或复杂分页聚合，必须在 Model 层的自定义扩展文件（如 `user_model_custom.go`）中声明接口与实现，严禁将复杂的 SQL 片段散落在 Logic 层中。
  * **事务操作必须由 Session 承载**：单服务内部多表写入必须使用 `m.Trans(ctx, func(ctx context.Context, session sqlx.Session) error { ... })`；并在事务闭环内使用 `session` 句柄执行 SQL。
* **空值与 Not Found 处理**：查询返回 `model.ErrNotFound` 时，Logic 层应捕获并转换为业务可读的 `xerr.RecordNotFound` 或返回预期的零值结构，禁止直接向上抛出 500 系统 Panic。

### 4.6 本地 MCP 项目级配置与 AI 协同规范 (Project-Level MCP & Spec Tools)
项目已内置并激活由 `mise` 统一版本锁定的四大本地 MCP 服务。并在项目级直接提供了配置文件（[`.mcp.json`](.mcp.json)、[`.cursor/mcp.json`](.cursor/mcp.json)、[`.vscode/mcp.json`](.vscode/mcp.json)）：
```json
{
  "mcpServers": {
    "go-zero": {
      "command": "mcp-zero"
    },
    "antd": {
      "command": "antd",
      "args": ["mcp"]
    },
    "codegraph": {
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    },
    "gitnexus": {
      "command": "gitnexus",
      "args": ["mcp"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```
* **五大 MCP 核心矩阵**：
  * **`go-zero` (mcp-zero v1.0.0)**：自动化执行 `goctl` 代码生成、API/RPC 验证、DDL 逆向 Model 与项目分析。
  * **`antd` (v6.6.2)**：毫秒级离线检索 75 个 Ant Design 组件的 Props、Design Tokens、classNames/styles 语义结构与可运行 Demo。
  * **`codegraph` (v1.6.0)**：本地持久化代码知识图谱，向 Agent 提供基于 AST 的符号定义、跨文件依赖与调用链路追踪（减少盲目文件扫描与 Token 消耗）。
  * **`gitnexus` (v1.6.11)**：基于知识图谱的代码全景引擎，专攻**修改影响面分析（Impact Analysis）**，精准回答“修改此方法会导致哪些下游调用链破坏”。
  * **`chrome-devtools` (chrome-devtools-mcp)**：连接并控制 Chrome 浏览器开发者工具，支持页面检查、Console 错误追踪、网络请求监听与 DOM 自动化调试。
* **离线模式库与工作流**：本地已持久化缓存 [`.agents/skills/zero-skills/`](.agents/skills/zero-skills/) 与 [`.ai-context/`](.ai-context/)。Claude 在编写微服务代码时应优先调用此知识库中的最佳实践。

### 4.7 前端 Ant Design 规范与 CLI 工具使用守则
本项目前端统一基于 **Ant Design 6.x** 构建，组件 API 与定制模式存在演进与破坏性变更。Claude 及其他 AI 必须严格遵守以下规范：
1. **深度理解官方全量组件知识（Official LLM Knowledge Base）**：
   * 开发前端界面时，必须阅读并参考 [https://ant.design/llms-full.txt](https://ant.design/llms-full.txt)，深入理解 Ant Design 75 个全量组件的设计体系与规范、类型提取工具（如 `GetRef`、`GetProps`、`GetProp`）以及上下文机制，在编写 Ant Design 代码时充分应用这些知识。
2. **写前必查（Query Before Writing）**：
   * 严禁凭旧版本（v3/v4/v5）记忆臆测组件 Props 或配置项。编码前使用 `@ant-design/cli` 本地毫秒级查询：
     ```bash
     antd info <Component> --format json  # 查询最新 Props、类型及默认值
     antd demo <Component> <demoKey>      # 获取官方标准运行示例代码
     antd semantic <Component>            # 查看语义化 DOM 结构 (classNames / styles)
     ```
3. **严防废弃用法（No Deprecated APIs）**：
   * **变体与边框**：禁止使用已被弃用的 `Card bordered`（必须使用 `variant="borderless"` 等）。
   * **样式定制**：样式属性全面转向语义化 `styles` 与 `classNames` 体系，禁止使用弃用的 `valueStyle`、`bodyStyle`、`headStyle` 等旧属性。
   * **全局反馈组件**：禁止直接使用全局静态 `message.success()` / `notification` / `Modal`（无法继承 `ConfigProvider` 主题上下文）。根层必须包裹 `<App>` 并通过 `App.useApp()` Hook 消费。
4. **改后必 Lint（Lint After Changes）**：
   * 编写或修改前端 Ant Design 代码后，必须执行 `just lint-antd`（或 `antd lint <path>`），确保 0 警告 0 废弃项。
5. **诊断与故障排查（Doctor & Env）**：
   * 若遇组件或依赖异常，运行 `antd doctor` 与 `antd env` 快速定位环境与 peerDependencies 问题。

---

## 5. 常用命令速查 (Cheat Sheet)

### 5.1 代码生成
```bash
# 生成网关后端代码
just gen-gateway
# 或：make gen-gateway

# 生成微服务 RPC 代码
just gen-rpc user
just gen-rpc worker
# 或：make gen-user-rpc / make gen-worker-rpc

# 生成前端 TypeScript SDK
just gen-ts
# 或：make gen-ts
```

### 5.2 本地运行 (直连模式)
```bash
# 启动微服务（本地开发直连模式）
just run-user-rpc     # 监听 127.0.0.1:8080 (或: make run-user-rpc)
just run-worker-rpc   # 监听 127.0.0.1:8082 (或: make run-worker-rpc)

# 启动统一网关
just run-gateway      # 监听 0.0.0.0:8888 (或: make run-gateway)

# 启动前端应用
just run-admin        # 管理后台 (http://localhost:3001)
just run-portal       # 官方门户 (http://localhost:3000)
```

### 5.3 依赖整理与构建
```bash
just build-frontend   # 构建前端各端产物 (或: make build-frontend / just build-web)
just tidy             # 整理后端 go.mod 依赖 (或: make tidy)
make test             # 运行全仓后端单元测试
```

### 5.4 Ant Design 离线知识库与 Lint 诊断 (CLI)
```bash
# 全仓前端静态语法规范与弃用项检测 (改动前端后必跑)
just lint-antd

# 单独对特定目录进行扫描
antd lint ./frontend/apps/admin/src
antd lint ./frontend/apps/portal/src

# 离线组件知识库毫秒级查询
antd info Card --format json          # 查询组件最新完整 Props 与废弃标识
antd demo Statistic basic             # 查询组件标准 Demo 源码
antd semantic Button                  # 查询组件 classNames / styles 语义化插槽
antd doctor                           # 诊断项目级配置、依赖与环境兼容性
```

### 5.5 联调验证 (cURL)
```bash
# 1. 验证用户接口 (网关透传 user-rpc)
curl "http://127.0.0.1:8888/api/v1/user/info?id=1"

# 2. 验证订单详情聚合接口 (网关内网并行聚合 user-rpc + order-rpc)
curl "http://127.0.0.1:8888/api/v1/order/detail?orderId=1001"
```

---

## 6. 新增业务微服务标准流程 (Adding a New Service)

当需要扩展新业务域（如 `payment` 支付服务）时，请严格按以下步骤操作：

1. **创建服务骨架**：
   创建 `app/payment/rpc` 与 `app/payment/model`。
2. **编写 Protobuf 契约**：
   在 `app/payment/rpc/payment.proto` 中定义 gRPC 请求与响应方法。
3. **生成 RPC 桩代码与客户端**：
   ```bash
   just gen-rpc payment
   ```
4. **接入网关 (Gateway)**：
   * 在 `app/gateway/desc/payment.api` 编写对外暴露的 HTTP 路由契约。
   * 在 `app/gateway/desc/gateway.api` 中追加 `import "payment.api"`。
   * 重新生成网关代码：`just gen-gateway`。
   * 在 `app/gateway/internal/config/config.go` 与 `etc/gateway.yaml` 中配置 `PaymentRpc` 连接。
   * 在 `app/gateway/internal/svc/service_context.go` 中注入客户端。
   * 在 `app/gateway/internal/logic/payment/` 中实现业务编排。
5. **同步前端 SDK**：
   执行 `just gen-ts` 将新接口自动同步到前端各端。
6. **补充 Just / Make 命令**：
   在 `justfile` 与 `Makefile` 中增加 `run-payment-rpc` 指令。

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **go-zero-demo** (895 symbols, 1780 relationships, 68 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/go-zero-boilerplate/context` | Codebase overview, check index freshness |
| `gitnexus://repo/go-zero-boilerplate/clusters` | All functional areas |
| `gitnexus://repo/go-zero-boilerplate/processes` | All execution flows |
| `gitnexus://repo/go-zero-boilerplate/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
