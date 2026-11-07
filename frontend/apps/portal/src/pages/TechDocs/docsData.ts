import type { DocCategoryVO } from "./types";

export const TECH_DOCS_DATA: DocCategoryVO[] = [
  {
    id: "getting-started",
    title: "1. 快速上手 (Getting Started)",
    icon: "RocketOutlined",
    description: "本地开发环境配置、多端全栈大仓依赖启动与高频开发命令速查",
    chapters: [
      {
        id: "quick-start",
        categoryId: "getting-started",
        title: "5 分钟本地开发起步指南",
        badge: "新手必读",
        readTime: "5 min",
        summary: "从零安装 mise 工具链、一键启动 Docker 依赖环境并运行全栈微服务服务集群",
        updatedAt: "2026-09-25",
        headings: [
          { id: "prerequisites", text: "环境与工具链版本锁", level: 2 },
          { id: "docker-deps", text: "一键拉起基础设施容器", level: 2 },
          { id: "start-services", text: "启动后端微服务集群", level: 2 },
          { id: "start-frontends", text: "启动前端多端工作台", level: 2 },
        ],
        sections: [
          {
            paragraphs: [
              "欢迎来到 go-zero-boilerplate 全栈大仓！本项目采用 Fullstack Monorepo 架构，统一了后端微服务网关体系与前端 pnpm workspace 多端工程。通过现代化的 mise 工具链，您可以在 5 分钟内快速拉起所有开发环境并开始业务开发。",
            ],
            callout: {
              type: "tip",
              title: "工具链版本锁定提示",
              text: "本项目已在根目录 mise.toml 中严格锁定了 Go 1.24+、Node 22+、pnpm 11+、goctl 1.10.3、protoc 29+ 以及 just 命令执行器，建议全局安装 mise 后执行 mise install 实现环境零冲突。",
            },
          },
          {
            heading: { id: "prerequisites", text: "环境与工具链版本锁", level: 2 },
            paragraphs: [
              "在开始前，请确保本地已安装 Docker Desktop 并处于运行状态。使用 mise 自动化接管语言与 CLI 工具：",
            ],
            codeBlock: {
              language: "bash",
              filename: "Terminal",
              code: `# 1. 克隆代码仓库
git clone https://github.com/zeromicro/go-zero-boilerplate.git
cd go-zero-boilerplate

# 2. 安装并信任 mise 工具链版本锁
mise trust
mise install`,
            },
          },
          {
            heading: { id: "docker-deps", text: "一键拉起基础设施容器", level: 2 },
            paragraphs: [
              "大仓内置了开箱即用的基础设施编排清单（MySQL 8.0, Redis 7.0, Nacos 2.x, Temporal），一键即可初始化数据表与字典种子数据：",
            ],
            codeBlock: {
              language: "bash",
              filename: "Terminal",
              code: `# 一键启动所有基础设施容器（MySQL :3306, Redis :6379, Nacos :8848, Temporal :7233/:8233）
mise run up:deps

# 验证容器运行状态
docker ps`,
            },
          },
          {
            heading: { id: "start-services", text: "启动后端微服务集群", level: 2 },
            paragraphs: [
              "使用 just 命令一键编译并并行启动统一网关与 4 个 gRPC 业务微服务：",
            ],
            codeBlock: {
              language: "bash",
              filename: "Terminal",
              code: `# 并发启动微服务后端集群（Gateway :8888, User :8080, Worker :8082, ITSM :8084, Titan :8086）
just run-backend

# 或者单服务独立调试（以统一网关为例）
just run-gateway`,
            },
          },
          {
            heading: { id: "start-frontends", text: "启动前端多端工作台", level: 2 },
            paragraphs: [
              "前端采用 pnpm workspace 大仓体系，包含技术门户、管理后台与独立交付工作台：",
            ],
            codeBlock: {
              language: "bash",
              filename: "Terminal",
              code: `# 安装前端工作区依赖
pnpm install

# 启动技术门户系统 (:3000)
pnpm dev:portal

# 启动企业管理后台系统 (:3001)
pnpm dev:admin

# 启动 Titan 独立交付工作台 (:3002)
pnpm dev:titan`,
            },
          },
        ],
      },
      {
        id: "monorepo-layout",
        categoryId: "getting-started",
        title: "全栈 Monorepo 目录结构规范与职责",
        readTime: "4 min",
        summary: "深入理解 app/ 后端微服务、frontend/ 前端大仓与 pkg/ 跨服务基础设施的物理边界隔离",
        updatedAt: "2026-09-25",
        headings: [
          { id: "backend-layout", text: "后端微服务体系 (app/)", level: 2 },
          { id: "frontend-layout", text: "前端多端工作区 (frontend/)", level: 2 },
          { id: "pkg-guardrails", text: "公共包守则与物理边界防腐 (pkg/)", level: 2 },
        ],
        sections: [
          {
            heading: { id: "backend-layout", text: "后端微服务体系 (app/)", level: 2 },
            paragraphs: [
              "后端所有微服务收敛在 app/ 目录下，每个微服务遵循标准的 go-zero 推荐骨架：",
            ],
            codeBlock: {
              language: "text",
              filename: "Directory Structure",
              code: `app/
├── gateway/           # 统一对外 HTTP 网关 / BFF 服务 (端口 8888)
│   ├── desc/          # 模块化 API 契约定义 (gateway.api, user.api, titan.api 等)
│   └── internal/      # 网关内部逻辑 (禁止直接连接数据库或持有 SQL/Cache 句柄)
├── user/              # 用户中心微服务 (纯 gRPC 端口 8080)
│   ├── rpc/           # gRPC 契约与领域实现 (pb/, internal/, logic/)
│   └── model/         # 持久层 Model (由 goctl 从 DDL 驱动生成，带 Cache-Aside)
├── worker/            # 异步任务与 Temporal 微服务 (纯 gRPC 端口 8082)
├── itsm/              # ITSM 流程微服务 (纯 gRPC 端口 8084，内置 BPMN 2.0 引擎)
└── titan/             # 交付平台微服务 (纯 gRPC 端口 8086，K8s & Helm 编排)`,
            },
          },
          {
            heading: { id: "frontend-layout", text: "前端多端工作区 (frontend/)", level: 2 },
            paragraphs: [
              "前端采用 pnpm workspace 集中纳管多端应用与共享代码库：",
            ],
            codeBlock: {
              language: "text",
              filename: "Frontend Layout",
              code: `frontend/
├── apps/
│   ├── portal/        # 官方技术门户 (Vite + TS，端口 3000)
│   ├── admin/         # 企业管理后台 (Ant Design Pro，端口 3001)
│   └── titan/         # 独立交付工作台 (端口 3002)
└── packages/
    ├── api/           # 共享 API SDK (@zero/api，由 goctl api ts 自动从网关生成)
    └── shared/        # 共享工具类与常量 (@zero/shared)`,
            },
          },
          {
            heading: { id: "pkg-guardrails", text: "公共包守则与物理边界防腐 (pkg/)", level: 2 },
            paragraphs: [
              "根目录 pkg/ 存放跨服务的全局基础设施包（如 nacosx 注册发现、result 响应包装、xerr 错误码抽象）。",
            ],
            callout: {
              type: "warning",
              title: "架构红线：物理防腐隔离",
              text: "pkg/ 包禁止反向依赖任何 app/ 下的业务代码；内部微服务之间绝对禁止直接跨 internal 导入对方代码，必须且只能经由 gRPC RPC Client 进行服务间通信。",
            },
          },
        ],
      },
      {
        id: "command-cheatsheet",
        categoryId: "getting-started",
        title: "常用开发与运维命令速查手册",
        readTime: "3 min",
        summary: "高频 justfile 与 Makefile 任务命令、代码生成指令与代码质量扫描指南",
        updatedAt: "2026-09-25",
        headings: [
          { id: "code-gen", text: "全栈契约与代码生成", level: 2 },
          { id: "lint-and-test", text: "质量门禁与全量测试", level: 2 },
        ],
        sections: [
          {
            heading: { id: "code-gen", text: "全栈契约与代码生成", level: 2 },
            paragraphs: [
              "在大仓开发中，所有 API 路由、gRPC 契约与数据库映射均由 IDL First 契约驱动：",
            ],
            codeBlock: {
              language: "bash",
              filename: "Terminal",
              code: `# 1. 修改 app/gateway/desc/*.api 后，生成网关后端代码
just gen-gateway

# 2. 自动同步生成前端 @zero/api 强类型 SDK
just gen-ts

# 3. 修改微服务 proto 后，生成 RPC 桩代码（以 user 为例）
just gen-rpc user

# 4. 根据 DDL 逆向更新 MySQL 带缓存持久层 Model
just gen-model user sys_user.sql`,
            },
          },
          {
            heading: { id: "lint-and-test", text: "质量门禁与全量测试", level: 2 },
            paragraphs: [
              "提交代码前，执行全栈测试与 Ant Design 6.x Lint 扫描，确保 0 警告 0 废弃项：",
            ],
            codeBlock: {
              language: "bash",
              filename: "Terminal",
              code: `# 运行全栈前端 180+ 单元测试
pnpm test

# 执行 Ant Design 6.x 废弃 API 扫描
npx antd lint ./frontend/apps/portal/src
npx antd lint ./frontend/apps/admin/src

# 运行后端全量 Go 单元测试
just test-backend`,
            },
          },
        ],
      },
    ],
  },
  {
    id: "architecture",
    title: "2. 核心架构规范 (Architecture Rules)",
    icon: "ClusterOutlined",
    description: "网关 BFF 职责边界、纯 gRPC 隔离、Context 上下文第一公民与 Cache-Aside 强一致持久层守则",
    chapters: [
      {
        id: "gateway-bff-rules",
        categoryId: "architecture",
        title: "统一网关 BFF 原则与并发聚合",
        badge: "架构红线",
        readTime: "6 min",
        summary: "网关职责边界防护、禁止持有 SQL/Cache 句柄与使用 mr.Finish 进行高吞吐聚合",
        updatedAt: "2026-09-25",
        headings: [
          { id: "gateway-boundary", text: "网关职责边界与禁区", level: 2 },
          { id: "mr-finish", text: "使用 mr.Finish 跨服务高吞吐聚合", level: 2 },
        ],
        sections: [
          {
            heading: { id: "gateway-boundary", text: "网关职责边界与禁区", level: 2 },
            paragraphs: [
              "统一网关 app/gateway 是整个微服务大仓对外的唯一 HTTP 流量入口，承载路由分发、参数校验、JWT 鉴权解析、RBAC 切面拦截与统一响应封装（pkg/result）。",
            ],
            callout: {
              type: "warning",
              title: "绝对禁止直连持久层",
              text: "网关 Logic 绝对禁止直连 MySQL 数据库或持有任何 SQL/Redis 句柄！所有数据操作必须下沉至下游对应的微服务 gRPC RPC Logic 中闭环。网关仅扮演流量调度与数据聚合的 BFF（Backend For Frontend）角色。",
            },
          },
          {
            heading: { id: "mr-finish", text: "使用 mr.Finish 跨服务高吞吐聚合", level: 2 },
            paragraphs: [
              "当网关需要在一个接口中同时拉取多个微服务的数据时（如仪表盘大盘概览），严禁使用低效的串行 gRPC 调用，必须使用 go-zero 的 mr.Finish 并发调度器：",
            ],
            codeBlock: {
              language: "go",
              filename: "app/gateway/internal/logic/dashboard/getoverviewlogic.go",
              code: `// 使用 mr.Finish 并发调用下游微服务，任何一个协程报错立即短路退出
err := mr.Finish(
    func() error {
        userCountRes, err := l.svcCtx.UserRpc.GetUserCount(l.ctx, &user.EmptyReq{})
        if err != nil {
            return err
        }
        resp.TotalUsers = userCountRes.Total
        return nil
    },
    func() error {
        taskRes, err := l.svcCtx.WorkerRpc.GetTaskSummary(l.ctx, &worker.EmptyReq{})
        if err != nil {
            return err
        }
        resp.ActiveTasks = taskRes.Active
        return nil
    },
    func() error {
        itsmRes, err := l.svcCtx.ItsmRpc.GetTicketStats(l.ctx, &itsm.EmptyReq{})
        if err != nil {
            return err
        }
        resp.PendingTickets = itsmRes.Pending
        return nil
    },
)
if err != nil {
    return nil, err
}`,
            },
          },
        ],
      },
      {
        id: "context-propagation",
        categoryId: "architecture",
        title: "Context 绝对第一公民与级联取消传播",
        readTime: "4 min",
        summary: "链路追踪 Trace ID 贯穿、超时控制与客户端断开时的级联资源释放",
        updatedAt: "2026-09-25",
        headings: [
          { id: "context-rules", text: "上下文透传铁律", level: 2 },
          { id: "cancel-propagation", text: "级联超时与取消传播", level: 2 },
        ],
        sections: [
          {
            heading: { id: "context-rules", text: "上下文透传铁律", level: 2 },
            paragraphs: [
              "在所有的 Logic、RPC Client、Model 持久层、Redis 缓存与并发调用中，ctx 必须作为第一个参数层层穿透，严禁在业务链路中使用 context.Background() 或 context.TODO()。",
            ],
            callout: {
              type: "important",
              title: "Context 第一公民",
              text: "丢失 Context 意味着链路追踪 Trace ID 中断，网关排查日志将无法关联下游微服务的 RPC 调用日志，且无法在客户端中断请求时及时释放数据库连接与 Goroutine 资源。",
            },
          },
          {
            heading: { id: "cancel-propagation", text: "级联超时与取消传播", level: 2 },
            paragraphs: [
              "当用户取消前端请求或网关设置了 3 秒超时保护时，Context 的 Done 通道会立即关闭，下游所有的 RPC 调用、SQL 查询和 Redis 操作均会自动取消，避免服务器无谓的算力与连接浪费。",
            ],
          },
        ],
      },
      {
        id: "cache-aside-spec",
        categoryId: "architecture",
        title: "持久层 Cache-Aside 强一致规范与 Session 事务",
        badge: "数据一致性",
        readTime: "5 min",
        summary: "防击穿防雪崩的带缓存 Model 规范，先写数据库再精准淘汰 Key，多表变更严格使用 TransactCtx",
        updatedAt: "2026-09-25",
        headings: [
          { id: "cache-aside", text: "Cache-Aside 淘汰规范", level: 2 },
          { id: "session-trans", text: "基于 Session 的事务闭环", level: 2 },
        ],
        sections: [
          {
            heading: { id: "cache-aside", text: "Cache-Aside 淘汰规范", level: 2 },
            paragraphs: [
              "大仓中所有单行数据查询（FindOne）自动命中 Redis 缓存。在执行 Update 或 Delete 时，必须使用 go-zero 的 CachedConn 句柄：",
              "1. 底层先执行 MySQL 数据库更新/物理删除；",
              "2. 数据库操作成功后，精准淘汰实体对应的 Redis Key，绝不采用直接更新缓存的方式，杜绝双写脏数据与缓存雪崩。",
            ],
          },
          {
            heading: { id: "session-trans", text: "基于 Session 的事务闭环", level: 2 },
            paragraphs: [
              "单服务内部涉及多张表的关联写入（如创建用户同时分配角色与组织架构），必须使用 m.Trans 事务管理器，并在事务回调中统一使用 session 句柄执行 SQL：",
            ],
            codeBlock: {
              language: "go",
              filename: "app/user/model/sys_user_model.go",
              code: `return m.Trans(ctx, func(ctx context.Context, session sqlx.Session) error {
    // 1. 插入用户主表
    userId, err := m.InsertWithSession(ctx, session, userEntity)
    if err != nil {
        return err
    }
    // 2. 插入用户角色关联表（必须传入同一个 session 句柄）
    return m.userRoleModel.InsertBatchWithSession(ctx, session, userId, roleIds)
})`,
            },
          },
        ],
      },
    ],
  },
  {
    id: "governance",
    title: "3. 企业级治理体系 (Governance System)",
    icon: "SafetyCertificateOutlined",
    description: "“一石二鸟”按钮-接口动态 RBAC 鉴权模型、零阻塞异步操作审计与 Casdoor SSO 统一认证",
    chapters: [
      {
        id: "rbac-dual-binding",
        categoryId: "governance",
        title: "“一石二鸟”按钮-接口联动动态 RBAC 模型",
        badge: "核心专利级设计",
        readTime: "5 min",
        summary: "前端按钮权限与后端 API 接口绑定联动，角色授权一次配置同时约束前后台，RESTful 动态正则匹配",
        updatedAt: "2026-09-25",
        headings: [
          { id: "rbac-design", text: "一石二鸟设计哲学", level: 2 },
          { id: "regex-route-matching", text: "RESTful 动态路由正则匹配", level: 2 },
        ],
        sections: [
          {
            heading: { id: "rbac-design", text: "一石二鸟设计哲学", level: 2 },
            paragraphs: [
              "传统 RBAC 系统中，前端控制按钮显隐，后端单独配置接口权限表，两套权限各自为政，配置极易脱节脱靶。",
              "本项目创新采用『一石二鸟』权限体系：在 sys_menu 表中，每个按钮权限节点通过 sys_menu_api 显式绑定一个或多个后端 API 路由。管理员在角色管理中勾选某个按钮，系统自动联动开通该按钮依赖的后端接口权限，前台控展示、后台控鉴权，一处配置双端闭环。",
            ],
          },
          {
            heading: { id: "regex-route-matching", text: "RESTful 动态路由正则匹配", level: 2 },
            paragraphs: [
              "网关全局挂载 RbacMiddleware，当请求到达网关时，下游 User 微服务会自动将带参数的路由（如 /api/v1/titan/projects/:id）转换为正则表达式（^/api/v1/titan/projects/[^/]+$），毫秒级判定当前调用员工是否持有通行权限。",
            ],
          },
        ],
      },
      {
        id: "audit-logging",
        categoryId: "governance",
        title: "零阻塞异步双日志审计机制 (OperLog & LoginLog)",
        readTime: "4 min",
        summary: "网关切面捕获 POST/PUT/DELETE 写操作，独立 Goroutine 异步派发，业务响应耗时 0 损耗",
        updatedAt: "2026-09-25",
        headings: [
          { id: "oper-log", text: "操作日志切面 (sys_oper_log)", level: 2 },
          { id: "login-log", text: "登录日志追踪 (sys_login_log)", level: 2 },
        ],
        sections: [
          {
            heading: { id: "oper-log", text: "操作日志切面 (sys_oper_log)", level: 2 },
            paragraphs: [
              "网关中间件 OperLogMiddleware 会自动捕获所有写请求（POST/PUT/DELETE/PATCH），自动记录操作员工、模块标识、客户端真实 IP、HTTP 方法、接口 URL、执行耗时（毫秒）与响应状态码。",
            ],
            callout: {
              type: "tip",
              title: "零阻塞 Goroutine 派发",
              text: "日志写入采用 go func() 异步派发至下游微服务 RPC 写入数据库，对正常业务吞吐量与接口响应时延实现零阻塞（Zero-Overhead）。",
            },
          },
          {
            heading: { id: "login-log", text: "登录日志追踪 (sys_login_log)", level: 2 },
            paragraphs: [
              "在员工登录与移动客户登录 Logic 中，统一记录登录 IP、操作系统类型、浏览器 User-Agent 以及成功/失败提示信息，在管理后台 /system/logs 随时审计追溯。",
            ],
          },
        ],
      },
      {
        id: "casdoor-sso",
        categoryId: "governance",
        title: "Casdoor 企业级统一身份认证与员工 JIT 自动入职",
        readTime: "5 min",
        summary: "OAuth 2.0 / OIDC 标准协议对接，前端零密钥接触，服务端换票与自动 JIT 建档建权",
        updatedAt: "2026-09-25",
        headings: [
          { id: "oidc-flow", text: "OIDC 换票安全隔离", level: 2 },
          { id: "jit-provisioning", text: "员工 JIT 即时拨备 (Just-In-Time)", level: 2 },
        ],
        sections: [
          {
            heading: { id: "oidc-flow", text: "OIDC 换票安全隔离", level: 2 },
            paragraphs: [
              "技术门户与管理后台统一支持 Casdoor 单点登录。前端用户跳转至统一认证中心完成登录后，携带有有效期的临时 code 重定向回 /callback。",
              "前端禁止持有任何 ClientSecret！前端将 code 发送给网关，由网关服务端安全置换 AccessToken 并提取用户声明。",
            ],
          },
          {
            heading: { id: "jit-provisioning", text: "员工 JIT 即时拨备 (Just-In-Time)", level: 2 },
            paragraphs: [
              "如果登录员工在本地 sys_user 表中尚无记录，系统会在毫秒级内自动触发 JIT 即时建档，为其分配默认通用角色（ROLE_COMMON），免去管理员人工录入账号的繁琐流程。",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "workflows",
    title: "4. 异步工作流与交付引擎 (Workflows & Delivery)",
    icon: "DeploymentUnitOutlined",
    description: "基于 Temporal 的分布式工作流编排、ITSM BPMN 2.0 流程引擎与 Titan 云原生交付矩阵",
    chapters: [
      {
        id: "temporal-orchestration",
        categoryId: "workflows",
        title: "基于 Temporal 的分布式异步编排与 Saga 事务系统",
        badge: "分布式标杆",
        readTime: "6 min",
        summary: "轻量容器化集成，logx 日志无缝适配器，跨服务异步契约解耦与毫秒级执行轨迹追踪",
        updatedAt: "2026-09-25",
        headings: [
          { id: "temporal-arch", text: "Temporal 架构与集成", level: 2 },
          { id: "saga-compensation", text: "多步骤 Saga 事务与故障恢复", level: 2 },
        ],
        sections: [
          {
            heading: { id: "temporal-arch", text: "Temporal 架构与集成", level: 2 },
            paragraphs: [
              "异步任务微服务 app/worker 深度集成了 Temporal 工作流引擎。服务启动时同时拉起 gRPC Server 与 Temporal Worker 执行器，监听指定 TaskQueue。",
              "网关仅通过轻量 gRPC Client 触发与查询任务状态，严禁网关直接直连 Temporal 服务端，保证职责隔离。",
            ],
          },
          {
            heading: { id: "saga-compensation", text: "多步骤 Saga 事务与故障恢复", level: 2 },
            paragraphs: [
              "在长耗时报表生成、多阶段系统巡检中，Temporal 会自动记录每一个 Activity 步骤的输入输出。若某一步骤发生瞬时网络异常，系统自动按照指数避退算法重试；若不可恢复，则反向执行补偿动作，确保业务状态最终一致。",
            ],
          },
        ],
      },
      {
        id: "bpmn-engine",
        categoryId: "workflows",
        title: "ITSM BPMN 2.0 工业级流程引擎与动态表单",
        readTime: "5 min",
        summary: "多分支流程设计器、会签/或签状态机、动态字段只读/必填权限过滤与 Temporal SLA 超时监控",
        updatedAt: "2026-09-25",
        headings: [
          { id: "bpmn-parser", text: "BPMN 2.0 XML 解析与状态机", level: 2 },
          { id: "sla-monitor", text: "Temporal 分布式 SLA 履约超时监控", level: 2 },
        ],
        sections: [
          {
            heading: { id: "bpmn-parser", text: "BPMN 2.0 XML 解析与状态机", level: 2 },
            paragraphs: [
              "ITSM 微服务（app/itsm）内置了原生 BPMN 2.0 工业级流程解析器，能直接读取流程设计器导出的标准 XML 流程定义，支持用户任务、排他网关、并行网关与服务任务。",
            ],
          },
          {
            heading: { id: "sla-monitor", text: "Temporal 分布式 SLA 履约超时监控", level: 2 },
            paragraphs: [
              "工单流转过程中，自动关联 Temporal 工作流进行 SLA 倒计时监控。当工单处于某个审批节点超时未处理时，系统自动触发预警通知并向主管升级抄送。",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "adr",
    title: "5. ADR 架构决策记录库 (Architecture Decision Records)",
    icon: "FileTextOutlined",
    description: "历史重大架构决策背景、权衡因素、替代方案与最终决议规范",
    chapters: [
      {
        id: "adr-001",
        categoryId: "adr",
        title: "ADR-001: 为什么采用统一网关 BFF + 内部纯 gRPC 架构？",
        badge: "核心决策",
        readTime: "4 min",
        summary: "为什么坚决禁止业务微服务对外直接暴露 HTTP 端口，采用网关流量独占与内部 gRPC 治理",
        updatedAt: "2026-09-25",
        headings: [
          { id: "adr-001-context", text: "决策背景与痛点", level: 2 },
          { id: "adr-001-alternatives", text: "权衡考量的替代方案", level: 2 },
          { id: "adr-001-decision", text: "最终架构决策与收益", level: 2 },
        ],
        sections: [
          {
            heading: { id: "adr-001-context", text: "决策背景与痛点", level: 2 },
            paragraphs: [
              "在微服务演进初期，若允许每个业务微服务自行暴露 HTTP 端口，会导致：前端需要记忆多个域名和端口、跨域 CORS 问题频发、每个微服务重复实现 JWT 鉴权解析、难以做统一的 API 限流、统一日志审计与并发数据聚合。",
            ],
          },
          {
            heading: { id: "adr-001-alternatives", text: "权衡考量的替代方案", level: 2 },
            paragraphs: [
              "方案 A：每个微服务同时开启 HTTP 与 gRPC 双协议（被否决，增加端口暴露面与重复鉴权逻辑）；",
              "方案 B：Nginx 反向代理直接透传到微服务（被否决，缺乏跨微服务数据并发聚合能力）；",
              "方案 C：统一 Go 网关 BFF (Gateway :8888) + 内部纯 gRPC (User :8080 / Worker :8082 / ITSM :8084 / Titan :8086)。（本大仓所采纳）",
            ],
          },
          {
            heading: { id: "adr-001-decision", text: "最终架构决策与收益", level: 2 },
            paragraphs: [
              "决定：全栈大仓仅网关对外暴露 HTTP 8888 端口。所有内部业务微服务只保留 gRPC 服务，禁止对外暴露 HTTP 路由。网关作为唯一的流量防线与 BFF 聚合器，前端 SDK 仅需连接网关即可畅享强类型接口。",
            ],
          },
        ],
      },
      {
        id: "adr-002",
        categoryId: "adr",
        title: "ADR-002: 为什么选择 Temporal 替代传统消息队列做异步编排？",
        badge: "技术选型",
        readTime: "4 min",
        summary: "对比 Kafka / RabbitMQ，为什么在复杂长耗时工作流中选择基于状态持久化的 Temporal 引擎",
        updatedAt: "2026-09-25",
        headings: [
          { id: "adr-002-context", text: "决策背景与业务诉求", level: 2 },
          { id: "adr-002-comparison", text: "传统消息队列与 Temporal 对比", level: 2 },
          { id: "adr-002-decision", text: "最终选型决议", level: 2 },
        ],
        sections: [
          {
            heading: { id: "adr-002-context", text: "决策背景与业务诉求", level: 2 },
            paragraphs: [
              "在每日报表生成、ITSM 多节点长周期审批、Titan 多阶段流水线构建等场景中，任务往往跨越数分钟乃至数天，并涉及复杂的错误重试与回滚补偿逻辑。",
            ],
          },
          {
            heading: { id: "adr-002-comparison", text: "传统消息队列与 Temporal 对比", level: 2 },
            paragraphs: [
              "使用传统 MQ 处理多步骤工作流，开发者必须在 MySQL 中人工手写大量状态字段（`step1_status`, `step2_retry_count`），状态分散且代码充斥着回调地狱，发生服务器宕机时断点续传极其脆弱。",
              "Temporal 采用『代码即工作流 (Code as Workflow)』范式，每个变量、循环与调用自动在服务端持久化为事件流。当 Worker 宕机重启后，Temporal 会自动从断点精确恢复执行，且原生具备重试策略与毫秒级全链路调用历史记录。",
            ],
          },
          {
            heading: { id: "adr-002-decision", text: "最终选型决议", level: 2 },
            paragraphs: [
              "决定：全面采用 Temporal 作为长耗时任务与分布式 Saga 事务编排引擎，轻量单容器启动（内嵌 SQLite 支持），为企业级异步任务治理提供最优雅的工程闭环。",
            ],
          },
        ],
      },
      {
        id: "adr-003",
        categoryId: "adr",
        title: "ADR-003: 为什么选用 Casdoor 作为统一身份认证中心？",
        badge: "认证规范",
        readTime: "4 min",
        summary: "开源 OAuth 2.0 / OIDC 认证中心与本地双模登录体系的无缝集成考量",
        updatedAt: "2026-09-25",
        headings: [
          { id: "adr-003-context", text: "认证诉求与挑战", level: 2 },
          { id: "adr-003-decision", text: "双模认证决策与收益", level: 2 },
        ],
        sections: [
          {
            heading: { id: "adr-003-context", text: "认证诉求与挑战", level: 2 },
            paragraphs: [
              "现代化企业通常拥有多个独立系统（技术门户、管理后台、交付平台），如果每个系统各自维护一套用户密码表，不仅体验割裂，而且难以对接企业现有的 LDAP、飞书、企业微信或 GitHub 第三方认证。",
            ],
          },
          {
            heading: { id: "adr-003-decision", text: "双模认证决策与收益", level: 2 },
            paragraphs: [
              "决定：采用 Casdoor 作为独立统一认证中心，配合本地账号密码登录构成『双模认证』。所有前端应用统一通过 OIDC 协议对接，服务端通过 JIT 机制即时建档，用户一次登录全站畅行，极大地提升了企业级安全合规标准。",
            ],
          },
        ],
      },
    ],
  },
];

/**
 * 扁平化所有文档章节，便于上一篇/下一篇快速计算
 */
export function getAllChapters() {
  return TECH_DOCS_DATA.flatMap((cat) => cat.chapters);
}

/**
 * 按 ID 查找章节
 */
export function findChapterById(chapterId: string) {
  const all = getAllChapters();
  return all.find((c) => c.id === chapterId) || all[0];
}

/**
 * 计算上一篇与下一篇
 */
export function getAdjacentChapters(chapterId: string) {
  const all = getAllChapters();
  const index = all.findIndex((c) => c.id === chapterId);
  return {
    prev: index > 0 ? all[index - 1] : null,
    next: index < all.length - 1 ? all[index + 1] : null,
  };
}
