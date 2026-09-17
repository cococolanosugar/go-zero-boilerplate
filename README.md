# go-zero-boilerplate: 工业级全栈 Monorepo 脚手架模版

基于 [go-zero](https://github.com/zeromicro/go-zero) 与 **pnpm workspace** 搭建的工业级 **全栈 Monorepo（单仓多微服务 + 多端前端）** 架构。

* **后端**：仅 `gateway` 对外暴露统一 HTTP RESTful 接入端口，内部所有业务微服务（`user`、`worker`、`itsm`、`devops`）收缩为纯 gRPC 通信。
* **前端**：采用 `pnpm workspace` 统一管理后台（`admin`，基于 Ant Design 6.6.2 + Pro Components 2.8.10）与前台门户（`portal`，基于 Ant Design 6.6.2），通过 `goctl api ts` 自动生成统一的 `@zero/api` TypeScript SDK，契约一键直通！
* **认证**：深度集成 [Casdoor](https://casdoor.org) 企业级统一身份认证（IAM/SSO），支持 OAuth 2.0 / OIDC 授权码安全置换与微服务 JIT 即时自动拨备建档，与传统账号密码双模并存。
* **交付**：内置 **Titan 研发交付引擎**（`app/devops`，参考 Zadig 现代化云原生实践），支持源码检出、镜像构建、Kubernetes Helm/YAML 双模发布、Jenkins 委托调度与基于 Temporal 的 DAG 流水线与质量门禁卡点。

---

## 目录结构

```text
go-zero-boilerplate/
├── app/                           # 【后端 Go 微服务体系】
│   ├── gateway/                   # 【统一对外 HTTP 网关 / BFF 层】(端口 8888)
│   │   ├── desc/                  # 模块化 API 契约定义 (gateway.api, user.api, dashboard.api, task.api, itsm.api, devops.api)
│   │   ├── etc/gateway.yaml       # 网关配置
│   │   ├── internal/              # 网关内部实现 (config, handler, logic, svc, types)
│   │   └── gateway.go             # 网关启动 main 入口
│   │
│   ├── user/                      # 【用户微服务】纯 gRPC (端口 8080)
│   │   ├── rpc/                   # gRPC 核心服务及对外 client/user/
│   │   └── model/                 # 数据持久层
│   │
│   ├── worker/                    # 【异步任务微服务】纯 gRPC (端口 8082，内置 Temporal Worker)
│   │   ├── contract/              # 跨服务公共工作流契约（任务队列、信号、状态结构）
│   │   ├── rpc/                   # gRPC 核心服务及对外 client/worker/
│   │   └── model/                 # 异步任务持久层
│   │
│   ├── itsm/                      # 【ITSM 流程与工单微服务】纯 gRPC (端口 8084，BPMN 2.0 引擎与 SLA 调度)
│   │   ├── rpc/                   # gRPC 核心服务及对外 client/itsm/
│   │   └── model/                 # 流程定义、动态表单、工单流转持久层
│   │
│   └── devops/                    # 【DevOps 研发交付微服务 (Titan)】纯 gRPC (端口 8086，CI/CD 发布引擎)
│       ├── rpc/                   # gRPC 核心服务及对外 client/devops/ (K8s, Helm, Jenkins 集成)
│       └── model/                 # 流水线、执行实例、集群纳管、外部工具持久层
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
├── pkg/                           # 跨服务共享的 Go 通用库 (result, xerr, temporalx, storage, nacosx)
├── manifest/                      # 【交付与部署清单】
│   └── deploy/                    # 本地开发与容器部署 (docker-compose)
├── hack/                          # 【开发与运维辅助工具集】
│   └── scripts/                   # 代码生成跨平台脚本
├── mise.toml                      # 全栈工具链与版本锁 (Go, Node, pnpm, goctl, protoc, just, atlas, skeema)
├── justfile / Makefile            # 快速命令入口
├── go.mod / go.sum                # 根目录统一 Go 依赖
├── AGENTS.md                      # AI 与开发者项目全局规范
└── CLAUDE.md                      # Claude 助手开发执行指南
```

---

## 本地极速启动与验证

### 0. 工具链一键就绪 (Mise)
```bash
mise trust
mise install
```

### 1. 启动微服务与网关
```bash
# 启动用户微服务 (gRPC :8080)
just run-user-rpc

# 启动异步任务微服务 (gRPC :8082，内置 Temporal Worker)
just run-worker-rpc

# 启动 ITSM 流程微服务 (gRPC :8084，工单与审批流引擎)
just run-itsm-rpc

# 启动 Titan 研发交付微服务 (gRPC :8086，CI/CD 发布引擎)
just run-devops-rpc

# 启动统一网关 (HTTP :8888)
just run-gateway
```

### 2. 启动前端多端应用
```bash
# 启动管理后台 (http://localhost:3001)
just run-admin

# 启动官方门户 (http://localhost:3000)
just run-portal
```

### 3. 全栈契约一键同步 (IDL First)
当后端在 `app/gateway/desc/*.api` 中新增或修改接口后，只需运行：
```bash
just gen-ts
```
前端的 `frontend/packages/api/src` 会**自动生成强类型 TypeScript 函数与接口定义**，前端无需手写任何 Axios 请求！

---

## 常用命令速查

| 操作 | Just 命令 | Make 命令 |
| :--- | :--- | :--- |
| 生成网关后端代码 | `just gen-gateway` | `make gen-gateway` |
| 生成 user RPC | `just gen-rpc user` | `make gen-user-rpc` |
| 生成 worker RPC | `just gen-rpc worker` | `make gen-worker-rpc` |
| 生成 itsm RPC | `just gen-rpc itsm` | `make gen-itsm-rpc` |
| 生成 devops RPC | `just gen-rpc devops` | `make gen-devops-rpc` |
| **创建新微服务 RPC 模块** | `just new-rpc <service>` | `make new-rpc SERVICE=<service>` |
| **创建新微服务 API 模块** | `just new-api <service>` | `make new-api SERVICE=<service>` |
| **生成持久层 Model 代码** | `just gen-model` | `make gen-model` |
| **全栈 CRUD 一键代码生成** | `just gen-crud <service> <table>` | `make gen-crud SERVICE=<service> TABLE=<table>` |
| **数据库版本化迁移 (新建/执行/回滚/状态)** | `just migrate-(new/up/down/status)` | `make migrate-(new/up/down/status)` |
| **同步生成前端 TS SDK** | `just gen-ts` | `make gen-ts` |
| 启动网关 | `just run-gateway` | `make run-gateway` |
| 启动 user-rpc | `just run-user-rpc` | `make run-user-rpc` |
| 启动 worker-rpc | `just run-worker-rpc` | `make run-worker-rpc` |
| 启动 itsm-rpc | `just run-itsm-rpc` | `make run-itsm-rpc` |
| 启动 devops-rpc | `just run-devops-rpc` | `make run-devops-rpc` |
| 启动前端 Admin | `just run-admin` | `make run-admin` |
| 启动前端 Portal | `just run-portal` | `make run-portal` |
| 构建前端全部产物 | `just build-frontend` | `make build-frontend` |
| **前端自动化单元测试** | `just test-frontend` | `make test-frontend` |
| **前端 Ant Design 规范诊断** | `just lint-antd` | `make lint-antd` |
| **构建 AI 知识图谱与全景索引** | `just ai-index` | `make ai-index` |
| 整理 Go 依赖 | `just tidy` | `make tidy` |
| **一键启动全栈容器 (All-in-One)** | `just docker-up` | `make docker-up` |
| 停止全栈容器 | `just docker-down` | `make docker-down` |
| 启动开发基础设施 (MySQL/Redis/Etcd/Nacos/Temporal) | `just docker-infra-up` | `make docker-infra-up` |
| 构建所有 Docker 镜像 | `just docker-build` | `make docker-build` |
| **脚手架一键重命名** | `just rename-project <name>` | `make rename-project NEW_MODULE=<name>` |

---

## 服务注册与发现使用与切换指南 (Nacos / Etcd / 直连)

本项目已实现 **Nacos（当前默认）**、**Etcd** 与 **直连（Endpoints）** 三种模式的即插即用切换，完全无需改动业务逻辑代码。

### 1. 默认模式：Nacos 服务注册与发现
* **服务端**：`app/user/rpc/etc/user.yaml` 与 `app/worker/rpc/etc/worker.yaml` 默认支持 `Nacos` 配置，服务启动后自动通过 `pkg/nacosx` 注册到 Nacos，退出时优雅反注册。
  ```yaml
  Nacos:
    Host: ${NACOS_HOST:127.0.0.1}
    Port: ${NACOS_PORT:8848}
    NamespaceId: ${NACOS_NAMESPACE:public}
  ```
* **网关端**：`app/gateway/etc/gateway.yaml` 默认使用 `Target` 寻址：
  ```yaml
  UserRpc:
    Target: nacos://${NACOS_HOST:127.0.0.1}:${NACOS_PORT:8848}/user.rpc?namespaceid=${NACOS_NAMESPACE:public}&timeout=5000s
    NonBlock: true
  ```
* **一键启动中间件**：
  ```bash
  just docker-infra-up   # 包含 MySQL 8.0, Redis 7, Nacos 2.4.3, Etcd 3.5
  ```
  Nacos 控制台可访问：`http://localhost:8848/nacos`（默认账号密码：nacos / nacos）。

### 2. 切换模式：Etcd 服务注册与发现
若团队采用 Etcd 作为基础设施，只需修改配置文件：
* **服务端 YAML**：
  1. 将 `Nacos:` 块注释掉。
  2. 解开 `Etcd:` 块注释：
     ```yaml
     Etcd:
       Hosts:
         - ${ETCD_HOST:127.0.0.1:2379}
       Key: user.rpc
     ```
* **网关端 YAML (`gateway.yaml`)**：
  1. 将 `Target:` 行注释掉。
  2. 解开对应服务的 `Etcd:` 块注释：
     ```yaml
     UserRpc:
       Etcd:
         Hosts:
           - ${ETCD_HOST:127.0.0.1:2379}
         Key: user.rpc
       NonBlock: true
     ```

### 3. 本地轻量调试：直连模式 (Endpoints)
若本地仅想极速调试单一接口且不想运行任何注册中心容器：
* **服务端 YAML**：将 `Nacos` 与 `Etcd` 配置均注释掉。
* **网关端 YAML**：将 `Target` 与 `Etcd` 注释，开启 `Endpoints`：
  ```yaml
  UserRpc:
    Endpoints:
      - ${USER_RPC_HOST:127.0.0.1:8080}
    NonBlock: true
  ```

---

## 企业级核心能力与平台治理体系强化特性

### 1. 网关 RBAC 动态鉴权切面 (RBAC Middleware)
统一网关挂载 `RbacMiddleware`，与微服务 `CheckApiPermission` RPC 协同：
* **智能正则路径匹配**：自动将动态 RESTful 路由（如 `/api/v1/users/:id`）映射并匹配数据库 API 白名单与角色权限树。
* **白名单与超管豁免**：登录与公开接口自动放行；超级管理员（`UserId == 1` 或 `ROLE_ADMIN`）全局豁免。
* **统一 403 异常拦截**：未授权访问直接熔断返回标准 HTTP 403 结构体。
* **设计专篇与三表分工哲学**：详见 [企业级全栈 RBAC 与数据权限体系设计方案](doc/design/2026-09-06-permission/README.md)（含 `sys_menu_api` 与 `sys_role_api` 分工辨析、时序图与前后端一体化联动源码剖析）。

### 2. 企业级双日志审计闭环 (OperLog & LoginLog)
* **操作日志 (`sys_oper_log`)**：网关中间件 `OperLogMiddleware` 自动捕获所有写请求（`POST/PUT/DELETE/PATCH`），采集操作人、IP、URL、耗时、状态码等，通过**异步 Goroutine** 写入持久层，零阻塞业务请求。
* **登录日志 (`sys_login_log`)**：用户与员工登录成功/失败自动记录客户端 IP、浏览器与操作系统。
* **前端审计中心**：管理后台 `/system/logs` 采用 Ant Design ProTable 双 Tab 提供多维度筛选、状态指示与详情弹窗。

### 3. 企业级 Casdoor 统一身份认证与单点登录 (IAM / SSO)
* **OAuth 2.0 / OIDC 标准协议**：通过 Casdoor 统一身份认证中心（`:8000`）实现全栈 SSO，与本地账号密码登录模式并存（双模认证）。
* **服务端 OIDC 换票安全隔离**：前端仅携带静默重定向的 `code` 提交网关，由网关服务端通过 `ClientSecret` 与 Casdoor 进行后端令牌置换，杜绝密钥泄露风险。
* **微服务 JIT 即时自动拨备 (JIT Provisioning)**：新员工首次通过 SSO 登录时，用户微服务自动在本地 `sys_user` 建立档案并下发默认权限角色，免去人工建档流程。
* **多端 Parity 体验一致**：管理后台与官方门户均内置一键 SSO 登录与独立 `/callback` 路由，默认支持内网 IP 局域网跨设备联调。

### 4. 基于 Temporal 的分布式异步编排与工作流引擎 (Temporal Workflow & Worker)
* **架构隔离**：独立的 Worker 异步微服务（纯 gRPC `:8082`），同时内置 Temporal Worker 运行器，监听工作流任务队列。
* **统一日志适配**：`pkg/temporalx` 提供连接池与 go-zero `logx` 深度适配器，确保工作流底层与后端服务日志格式完全一致。
* **契约驱动解耦**：`app/worker/contract` 声明公共工作流契约，网关仅通过标准 gRPC 与 Worker 服务交互，杜绝网关直接暴露 Temporal SDK 依赖。
* **任务治理中心 (`sys_async_task`)**：全生命周期管理异步任务与状态流转（`READY`、`RUNNING`、`SUCCESS`、`FAILED`、`PAUSED`），支持基于 Temporal Schedule 的动态 Cron 周期调度、任务暂停/恢复与立即触发。
* **前端任务管理中心 (`/system/tasks`)**：基于 Ant Design ProTable 构建可视化任务运维看板与模态表单。
* **设计专篇**：详见 [Temporal 分布式工作流编排与异步任务治理系统设计方案](doc/design/2026-09-13-temporal-worker-and-task-management/README.md)。

### 5. 通用对象存储与安全上传服务 (Universal Storage Service & pkg/storage)
* **插拔式驱动设计**：提供统一 `Driver` 抽象，内置本地磁盘分级目录驱动，无缝扩展云端对象存储（MinIO、阿里云 OSS、AWS S3）。
* **内容寻址与即时秒传**：基于 SHA-256 哈希计算，对相同内容文件实行秒传与空间复用。
* **企业级安全防线**：拦截危险可执行后缀（`.exe`、`.bat`、`.sh`、`.php` 等），限制最大尺寸，防范路径穿越。
* **设计专篇**：详见 [通用对象存储与文件上传服务设计方案](doc/design/2026-09-12-universal-storage-service/README.md)。

### 6. 企业级 ITSM 流程与工单治理引擎 (ITSM Process & Service Desk Engine)
* **微服务纯 gRPC 隔离**：`app/itsm/rpc`（端口 `:8084`），支持高并发任务审批、工单流转、委派转办（TransferTask）与会签流转。
* **双端协同体验（Dual Persona）**：
  * **管理后台 (`apps/admin`)**：面向流程管理员与服务台坐席（`/itsm/process-defs` 流程设计编排、`/itsm/tickets` 全局工单监管运维大盘）。
  * **前台门户 (`apps/portal`)**：面向全员普通员工的企业 IT 自助服务台（`/desk`），提供服务目录卡片检索、动态表单即时申请、工单进度时间轴与催办/撤单。
* **设计专篇**：详见 [企业级 ITSM 流程与工单治理系统架构设计方案](doc/design/2026-09-17-itsm/README.md)。

### 7. 脚手架一键重命名与工程定制 (Rebranding)
只需一条命令即可将本脚手架一键定制为任意新项目名：
```bash
# Windows
just rename-project my-org/shop-system "Shop System"

# Linux / macOS
make rename-project NEW_MODULE=my-org/shop-system DISPLAY_NAME="Shop System"
```
脚本会自动安全替换：`go.mod`、所有 Go `import` 路径、YAML 配置文件、Docker/Compose 配置、MySQL 数据库名以及前端包配置与 UI 标题。

---

## 致敬与参考开源标杆 (Acknowledgements & References)

本项目在架构演进与前端工程化落地过程中，深度借鉴并融合了业界两大标杆开源项目的精髓：

* **[Ant Design Pro](https://pro.ant.design)**：阿里巴巴开源的企业级中后台最佳实践。本项目深度吸收了其 **统一页面容器 (`PageContainer`)**、**多语言国际化体系 (`useIntl`)**、**ProComponents 生产力套件 (`ProTable`, `ProForm`, `ProCard`)**、**声明式权限受控组件 (`<Access />`)** 与官方图表库 (`@ant-design/charts`)。特别在侧边栏底部辅助链接设计上，完全对齐官方 `all-blocks` 规范，通过 ProLayout 原生 `links` 挂载 `<LinkOutlined /> OpenAPI 文档`，兼具优雅的自适应折叠能力。
* **[LinaPro](https://github.com/linaproai/linapro)**：吸收 PHP 成熟中后台（FastAdmin、ThinkAdmin、Laravel-Admin）十余年演进经验的现代企业级管理中后台标杆。本项目核心参考了其 **“按钮与底层接口一石二鸟事务联动” (`sys_menu_api`)**、**操作与登录双日志审计机制 (`sys_oper_log` + `sys_login_log`)**、**全局数据字典系统 (`sys_dict_type` + `sys_dict_data`)** 与 **5 级数据权限作用域 (`sys_dept.ancestors`)**，并在 `go-zero` 全栈微服务 Monorepo 体系下实现了高并发与契约驱动的代码生成升维。

