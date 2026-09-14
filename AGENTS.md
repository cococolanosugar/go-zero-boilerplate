# AGENTS.md - Project Context & Guidelines

本文档为 AI Agent 以及开发者提供 `go-zero-boilerplate` 项目的全局架构上下文、开发规范、核心约束与常用运维指令。

---

## 1. 项目概览 (Project Overview)

* **项目名称**：`go-zero-boilerplate`
* **架构模式**：**Fullstack Monorepo 全栈大仓（统一网关微服务 + pnpm workspace 多端前端）**
* **后端框架**：[go-zero](https://github.com/zeromicro/go-zero) (v1.10.3)
* **前端框架**：React 18 + Vite + TypeScript + pnpm workspace（UI 库：Ant Design 6.6.2 & Ant Design Pro Components 2.8.10）
* **网络与通信规范**：
  * **仅 `app/gateway` 对外暴露 HTTP RESTful API**（端口 8888），作为唯一的流量入口与 BFF 层。
  * **内部所有业务微服务（`user`、`worker` 等）仅暴露 gRPC 接口**，不对外提供直接的 HTTP 访问。
  * **前端各端应用（`admin`、`portal`）统一经由 `@zero/api` SDK 调用网关**。
* **核心参考开源标杆**：
  * **[Ant Design Pro](https://pro.ant.design)**：提供前端企业级规范（`PageContainer` 页面容器、`useIntl` 多语言国际化体系、ProComponents 组件库与 `@ant-design/charts` 数据可视化）。
  * **[LinaPro](https://github.com/linaproai/linapro)**：提供后端权限与治理体系灵感（“一石二鸟”按钮-接口联动模型 `sys_menu_api`、双日志审计 `sys_oper_log`/`sys_login_log`、全局数据字典、5 级数据权限范围）。

---

## 2. 仓库目录结构规范 (Repository Layout)

```text
go-zero-boilerplate/
├── app/                           # 【后端 Go 微服务体系】
│   ├── gateway/                   # 统一对外 HTTP 网关 / BFF 服务 (端口 8888)
│   │   ├── desc/                  # 模块化 API 契约定义 (gateway.api, user.api, dashboard.api, task.api)
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
│   ├── nacosx/                    # Nacos 服务注册组件
│   ├── result/                    # 统一 HTTP 返回结构封装（HttpResult / ParamErrorResult）
│   ├── temporalx/                 # Temporal 客户端连接池与 logx 统一日志适配器
│   └── xerr/                      # 业务错误码与 CodeError 统一抽象
│
├── manifest/                      # 【交付与部署清单】
│   └── deploy/                    # 部署与运维资源 (docker-compose 等)
├── hack/                          # 【开发与运维辅助工具集】
│   └── scripts/                   # 跨平台代码生成与工具脚本（.ps1 与 .sh）
├── mise.toml                      # 全栈工具链与版本锁（Go, Node, pnpm, goctl, protoc, just 等）
├── justfile                       # Just 命令配置文件
├── Makefile                       # Make 命令配置文件
├── go.mod                         # 全局 Go 依赖管理
└── README.md                      # 项目使用指南
```

---

## 3. 架构原则与编码准则 (Architecture Rules & Guidelines)

### 3.1 后端职责边界防护
* **内部微服务禁开 HTTP**：业务微服务只保留 `rpc/` 和 `model/`，杜绝随意对外暴露端口。
* **Go `internal` 机制防护**：任何服务不得绕过 RPC 直接 import 另一个模块的 `internal/` 或 `model/`。
* **网关的核心职责**：仅负责“路由分发、参数校验、JWT 鉴权、跨 RPC 数据聚合”。**严禁在网关 Logic 中直连数据库或编写核心业务规则**，核心业务必须在各自微服务的 RPC Logic 中闭环。

### 3.2 统一响应与错误体系
* 网关 Handler 层必须使用 `pkg/result` 进行标准化输出：
  * 成功响应：`result.HttpResult(r, w, resp, nil)` -> `{ "code": 200, "msg": "SUCCESS", "data": { ... } }`。
  * 参数错误：`result.ParamErrorResult(r, w, err)` -> HTTP 400。
  * 跨 RPC 错误传递：`pkg/result/httpResult.go` 会自动从 gRPC status 中提取错误信息统一返回。

### 3.3 全栈契约驱动开发 (IDL First)
* **新增/修改 HTTP 接口与前端同步**：
  1. 在 `app/gateway/desc/<module>.api` 中增删路由。
  2. 若为新模块，在 `app/gateway/desc/gateway.api` 中 `import "<module>.api"`。
  3. 执行 `just gen-gateway` 生成后端网关桩代码。
  4. 执行 `just gen-ts` **自动生成前端 `@zero/api` SDK**，前端即可直接享用强类型的调用函数。
* **新增/修改微服务 RPC 接口**：
  1. 在 `app/<service>/rpc/<service>.proto` 中增删 RPC 方法。
  2. 执行 `just gen-rpc <service>`。

### 3.4 后端业务 Logic 与持久层 Model 编码深度规范 (基于 ai-context & zero-skills)
为保证 AI Agent 与开发者生成的后端业务代码具备生产级工程质量，必须严格遵守以下 Logic 与 Model 编写铁律：

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

### 3.5 本地 MCP 项目级配置与 AI 协同规范 (Project-Level MCP & Spec Tools)
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
* **离线模式库与工作流**：本地已持久化缓存 [`.agents/skills/zero-skills/`](.agents/skills/zero-skills/) 与 [`.ai-context/`](.ai-context/)。AI Agent 在编写微服务代码时应优先调用此知识库中的最佳实践。

### 3.6 前端 Ant Design 规范与 CLI 工具使用守则
本项目前端统一基于 **Ant Design 6.x** 构建，组件 API 与定制模式存在演进与破坏性变更。开发者及 AI Agent 必须严格遵守以下守则：
1. **深度理解官方全量组件知识（Official LLM Knowledge Base）**：
   * 开发前端界面时，必须阅读并参考 [https://ant.design/llms-full.txt](https://ant.design/llms-full.txt)，深入理解 Ant Design 75 个全量组件的设计体系与规范、类型提取工具（如 `GetRef`、`GetProps`、`GetProp`）以及上下文机制，在编写 Ant Design 代码时充分应用这些知识。
2. **写前必查（Query Before Writing）**：
   * 严禁凭历史记忆臆测组件 Props 或配置项。编写前使用 `@ant-design/cli` 查询确切 API：
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
6. **侧边栏辅助链接与 OpenAPI 规范 (ProLayout links & all-blocks)**：
   * 侧边栏底部辅助链接严格对齐官方 `ant-design/ant-design-pro (all-blocks)` 规范：严禁在 `menuFooterRender` 中注入大尺寸自定义 Card 组件破坏侧边栏留白。统一使用 ProLayout 原生 `links?: React.ReactNode[]` 挂载 `<LinkOutlined /> OpenAPI 文档`，并结合 `menuFooterRender` 自适应输出极简版权信息，保证展开与折叠态 100% 视觉协调。

### 3.7 服务注册与发现规范 (Service Discovery: Nacos & Etcd & Direct)
本项目支持 **Nacos（当前默认）**、**Etcd** 与 **直连（Endpoints）** 三种服务发现与寻址模式，支持零代码改动通过配置文件一键切换：

#### 1. 模式一：Nacos 服务注册与发现（当前默认）
* **服务端 (RPC Server)**：
  * 在 `etc/<service>.yaml` 中配置 `Nacos` 节点：
    ```yaml
    Nacos:
      Host: ${NACOS_HOST:127.0.0.1}
      Port: ${NACOS_PORT:8848}
      NamespaceId: ${NACOS_NAMESPACE:public}
    ```
  * 服务端入口 (`user.go`, `worker.go`) 调用 `pkg/nacosx.RegisterService(c.Name, c.ListenOn, c.Nacos)` 注册实例，容器退出时自动注销。
* **客户端 (Gateway / BFF)**：
  * 入口 `gateway.go` 中匿名导入 `_ "github.com/zeromicro/zero-contrib/zrpc/registry/nacos"` 挂载 gRPC resolver。
  * 在 `etc/gateway.yaml` 中使用 `Target` 格式寻址：
    ```yaml
    UserRpc:
      Target: nacos://${NACOS_HOST:127.0.0.1}:${NACOS_PORT:8848}/user.rpc?namespaceid=${NACOS_NAMESPACE:public}&timeout=5000s
      NonBlock: true
    ```

#### 2. 模式二：Etcd 服务注册与发现（无缝切换）
若需切换为 Etcd 注册发现机制：
* **服务端**：注释掉 `Nacos:` 节点，解开 `Etcd:` 节点注释：
  ```yaml
  Etcd:
    Hosts:
      - ${ETCD_HOST:127.0.0.1:2379}
    Key: user.rpc
  ```
  go-zero 核心底层自动处理 Etcd 租约心跳与注册。
* **客户端**：注释掉 `Target:` 配置，解开 `Etcd:` 节点注释：
  ```yaml
  UserRpc:
    Etcd:
      Hosts:
        - ${ETCD_HOST:127.0.0.1:2379}
      Key: user.rpc
    NonBlock: true
  ```

#### 3. 模式三：本地直连模式（单机调试）
本地单机调试且未启动任何注册中心容器时：
* **服务端**：`Nacos` 与 `Etcd` 配置均注释或置空。
* **客户端**：注释 `Target` 与 `Etcd`，直接配置微服务监听地址：
  ```yaml
  UserRpc:
    Endpoints:
      - ${USER_RPC_HOST:127.0.0.1:8080}
    NonBlock: true
  ```

### 3.8 网关 RBAC 动态鉴权与切面拦截 (Gateway RBAC Authorization Middleware)
* **拦截时机与范围**：
  * 在统一网关 `app/gateway/gateway.go` 全局挂载 `RbacMiddleware`。
  * **白名单放行**：对公开接口（如 `/api/v1/user/login`、`/api/v1/system/auth/login` 等）以及个人资料/菜单树等公用接口自动放行。
  * **超管豁免**：超级管理员（`UserId == 1` 或拥有 `ROLE_ADMIN` / `*` 标识）直接通行。
* **RESTful 动态正则路径匹配**：
  * 下游微服务 `CheckApiPermission` RPC 实现智能正则路由匹配（如将 `/api/v1/orders/:id` 自动转为 `^/api/v1/orders/[^/]+$`），支持路径变量接口的权限判定。
  * 鉴权失败由网关统一返回标准 HTTP 403 异常（`xerr.NewErrCode(xerr.Forbidden)`）。
* **完整架构设计与三表分工哲学**：
  * 详见设计专篇文档：[企业级全栈 RBAC 与数据权限体系设计方案](file:///D:/work/go-zero-boilerplate/doc/design/2026-09-06-permission/README.md)（含 `sys_menu_api` 与 `sys_role_api` 分工辨析、时序图与前后端联动源码剖析）。

### 3.9 企业级双日志审计机制 (Audit Logging: OperLog & LoginLog)
* **操作日志 (`sys_oper_log`)**：
  * 网关切面中间件 `OperLogMiddleware` 自动捕获所有写操作（`POST`、`PUT`、`DELETE`、`PATCH`）。
  * 自动记录：操作员工、请求方式、请求 URL、客户端真实 IP、响应状态码、执行耗时（毫秒）、错误堆栈。
  * 采用 `go func()` 异步 Goroutine 派发下游微服务 RPC 写入数据库，**对正常业务吞吐量与接口响应时延实现零阻塞（Zero-Overhead）**。
* **登录日志 (`sys_login_log`)**：
  * 员工登录与用户登录逻辑（`adminloginlogic.go` 等）统一记录登录 IP、操作系统、浏览器 User-Agent 及成功/失败提示。
* **前端审计日志中心**：
  * 管理后台 `/system/logs` 集成 Ant Design ProTable 双 Tab 标签页，支持按模块、操作人、IP、状态多条件筛选与详情弹窗。

### 3.10 前端类型架构与自动化测试规范 (Frontend Types Architecture & Testing)
* **类型边界防护守则 (`src/types/` vs `@zero/api`)**：
  * **严禁重复声明后端 DTO**：服务端数据传输对象、API 请求与响应结构体**唯一事实源为 `@zero/api`**（通过 `just gen-ts` 自动生成）。禁止在 `src/types/` 或页面内人工复制或冗余定义后端模型。
  * **`src/types/` 专用职责**：仅用于存放纯前端 UI 视图模型（ViewModel）、页面多步骤草稿态、表格列偏好设置等与后端接口无关的客户端状态。
* **前端自动化测试套件 (`tests/` & Vitest)**：
  * 采用 Vite 原生高速测试框架 **Vitest** 配合 `jsdom` 环境。
  * 关键边界逻辑（如 `access.ts` 权限判定、`storage.ts` 带 TTL 持久化存储、数据格式化等）必须编写单元测试覆盖。
  * 每次修改前端核心逻辑后，执行 `just test-frontend`（或 `pnpm test`）确保测试 100% 通过。

### 3.11 Casdoor 企业级统一身份认证与 SSO (IAM & SSO Architecture)
* **架构模式**：采用标准 OAuth 2.0 Authorization Code + OIDC 协议，Casdoor 作为独立统一认证中心（端口 8000），与本地账号密码登录模式并存（双模认证）。
* **OIDC 换票安全隔离**：
  * 前端通过 `@zero/shared` 的 `buildCasdoorAuthUrl` 跳转 Casdoor 授权页，经重定向回 `/callback?code=xxx`。
  * **严禁前端持有 ClientSecret**：前端仅携带 `code` 调用网关 `POST /api/v1/system/auth/casdoor/login`；由网关服务端使用 `ClientSecret` 向 Casdoor 置换 AccessToken 并提取 Claims。
* **用户即时拨备 (JIT Provisioning)**：
  * 网关调用 `UserRpc.SyncOrCreateCasdoorUser`：若存在本地 `sys_user` 账号则更新最新画像声明；若为全新员工，底层自动 JIT 建档并下发默认通用员工角色（`ROLE_COMMON` / `ROLE_USER`），实现零人工录入的自动化入职建档。
  * 用户登录后由网关统一签发系统内部标准 JWT Token（HS256），无缝享受既有 RBAC、菜单树与数据权限。
* **双端 Parity 对齐**：
  * 管理后台 (`apps/admin`) 与技术门户 (`apps/portal`) 统一提供一键 SSO 登录入口与独立 `/callback` 路由。
  * 默认端点自适应内网与局域网 IP（`http://192.168.31.174:8000`），支持多端局域网设备联调。

### 3.12 基于 Temporal 的分布式异步编排与 Saga 事务系统 (Temporal Workflow & Saga Orchestration)
* **架构定位**：
  * **Temporal 服务端**：基于 Docker 轻量化集成（`temporal server start-dev`，gRPC 端口 7233，Web 控制台 8233），零外部重型依赖，内置 SQLite 持久化支持。
  * **客户端基础库 (`pkg/temporalx`)**：提供开箱即用的连接池创建器与 go-zero `logx` 结构化日志无缝适配器（`logxAdapter`），确保工作流底层所有生命周期事件日志与后端整体日志格式 100% 统一。
  * **异步任务 Worker 微服务 (`app/worker/rpc`)**：纯 gRPC 微服务（端口 8082），同时承载 Temporal Worker 消费执行器，监听指定 TaskQueue（如 `ASYNC_TASK_QUEUE`），承载领域长耗时异步任务、状态机流转与分布式工作流编排。**网关仅通过标准 gRPC 客户端与 worker 服务交互，杜绝网关直接直连 Temporal 服务端**。
  * **契约解耦与类型安全 (`app/worker/contract`)**：网关与各业务服务仅依赖轻量契约定义（Workflow ID、Signal 信号、Query 状态查询、输入参数），无需直接依赖复杂的内部工作流实现代码。
* **标杆实现：异步任务调度工作流 (`DailyReportWorkflow` & `sys_async_task`)**：
  * **动态定时调度 (Cron Schedule)**：基于 Temporal Schedule API 将落库的异步任务记录（如每日报表 `daily_report_generate`）动态注册到 Temporal 调度器，支持暂停、恢复与立即触发运行。
  * **多步骤活动编排**：Worker 执行器顺序调度数据拉取、报表生成活动，自动具备毫秒级重试策略与状态实时回写。
* **开发调试与可视化**：
  * 开发者访问 `http://127.0.0.1:8233` 即可获得毫秒级、端到端的 Workflow 执行轨迹、输入输出参数、Event History、活动重试详情与全链路图谱。
* **前端全生命周期管理与设计专篇**：
  * 管理后台 `/system/tasks` 提供任务增删改查、状态流转（`READY`/`RUNNING`/`SUCCESS`/`FAILED`/`PAUSED`）、动态 Cron 与执行详情弹窗。
  * 完整架构设计详见设计专篇：[Temporal 分布式工作流编排与异步任务治理系统设计方案](file:///D:/work/go-zero-boilerplate/doc/design/2026-09-13-temporal-worker-and-task-management/README.md)。

---

## 4. 常用命令速查 (Cheat Sheet)

### 4.0 环境一键初始化 (Mise)
```bash
# 信任并安装所有指定版本的开发工具（Go, Node, pnpm, goctl, protoc, just, @ant-design/cli 等）
mise trust
mise install
```

### 4.1 代码生成
```bash
# 生成网关后端代码
just gen-gateway

# 生成微服务 RPC 代码
just gen-rpc user
just gen-rpc worker

# 创建新微服务 RPC 模块 (自动应用项目模板并置入 app/<service>/rpc)
just new-rpc <service>

# 创建新微服务 API 模块 (自动应用项目模板并置入 app/<service>/api)
just new-api <service>

# 生成数据库持久层 Model 代码（带 Redis 缓存支持）
just gen-model

# 生成前端 TypeScript SDK
just gen-ts
```

### 4.2 本地运行
```bash
# 1. 启动微服务（本地开发直连模式）
just run-user-rpc     # 监听 127.0.0.1:8080
just run-worker-rpc   # 监听 127.0.0.1:8082 (同时启动内置 Temporal Worker)

# 2. 启动统一网关
just run-gateway      # 监听 0.0.0.0:8888

# 3. 启动前端各端
just run-admin        # 启动管理后台 (http://localhost:3001)
just run-portal       # 启动官方门户 (http://localhost:3000)
```

### 4.3 前端构建与依赖
```bash
cd frontend && pnpm install  # 安装前端依赖
just build-frontend          # 构建前端所有项目产物
just test-frontend           # 运行前端全量自动化单元测试 (Vitest)
just tidy                    # 整理后端 Go 依赖
```

### 4.4 Ant Design 离线知识库与 Lint 诊断 (CLI)
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

### 4.5 容器化交付与全栈编排 (Docker)
```bash
# 1. 一键启动全栈所有容器 (基础设施 + 微服务 + 网关 + Nginx 前端)
just docker-up

# 2. 停止全栈所有容器
just docker-down

# 3. 仅启动本地开发所需的中间件容器 (MySQL, Redis, Etcd)
just docker-infra-up

# 4. 构建全栈所有 Docker 镜像
just docker-build
```

### 4.6 脚手架一键重命名 (Rebranding)
用于将脚手架一键迁移并定制为任意业务工程名（自动替换 Go module、import 路径、package.json、Docker、SQL 与前端常量）：
```bash
# Windows (PowerShell / Just)
just rename-project my-org/shop-system "Shop System"

# Linux / macOS (Bash / Make)
make rename-project NEW_MODULE=my-org/shop-system DISPLAY_NAME="Shop System"
```

### 4.7 数据库版本化迁移 (Database Migrations: Atlas)
采用 Atlas 管理数据库版本迁移（迁移文件位于 `manifest/sql/migrations/`），支持多环境正向递增与安全回滚：
```bash
# 1. 创建增量迁移脚本
just migrate-new create_sys_notice

# 2. 执行所有未应用的增量迁移（正向升级）
just migrate-up

# 3. 回滚最近一个迁移版本
just migrate-down

# 4. 查看当前迁移执行状态与版本列表
just migrate-status
```

### 4.8 全栈 CRUD 一键代码生成 (Full-Stack CRUD Code Generator)
从 MySQL 数据表一键逆向生成完整的全栈端到端生产级代码：
- 后端：带 Cache-Aside 与动态分页的 Model、微服务 RPC（契约 + Logic + Client）、网关 RESTful API（契约 + Logic + Handler）
- 前端：自动生成强类型 `@zero/api` SDK，并在管理后台输出符合 Ant Design 6.x / ProComponents 规范的独立 ProTable 页面并自动注册路由
```bash
# 语法：just gen-crud <所属微服务> <数据表名>
just gen-crud user sys_post
```

---

## 5. 新增业务微服务标准流程 (Adding a New Service)

当需要扩展新业务域（如 `payment` 支付服务）时，请遵循以下标准化步骤：

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
