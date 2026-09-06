# 企业级全栈 RBAC 与数据权限体系设计方案

> **文档版本**：v1.1.0  
> **更新日期**：2026-09-06  
> **文档路径**：`doc/design/2026-09-06-permission/README.md`  
> **设计目标**：为 `go-zero-boilerplate` 构建融合 PHP 成熟生态精髓的工业级、自动化、全栈权限管理体系（包含功能权限、数据范围权限、按钮-接口一体化联动、契约自动化扫描与 Ant Design Pro 动态前端）。

---

## 1. 设计背景与核心痛点

本项目基于 **Fullstack Monorepo（统一 HTTP 网关 + 纯 gRPC 业务微服务 + pnpm workspace 前端）** 架构。原有的登录模块仅完成了基础的“用户名/密码哈希校验 + JWT 签发与解析”，尚未具备生产级企业中后台所必须的权限管理能力。

### 1.1 传统权限设计的局限性与参考 PHP 生态的 6 大升级

传统 Java/Go 体系常采用基础的 **RBAC96** 模型（用户-角色-权限），在实际工程中存在诸多痛点。本方案深度融合并吸收了 **PHP 成熟生态（FastAdmin、Laravel-Permission、ThinkPHP Auth）** 打磨十余年的核心精髓，进行升维优化：

| 优化维度 | 传统 RBAC 痛点 | 借鉴 PHP 生态的解法 | 在本项目中的最佳实践 |
| :--- | :--- | :--- | :--- |
| **按钮与接口联动** | 按钮权限与接口权限分开配置，极易“看得到调不通”或“看不见调得通” | 权限节点直接挂载控制器动作，勾选即打通 | **按钮-接口一体化绑定 (Button-to-API Binding)**：按钮作为业务载体，勾选按钮自动打通底层 API |
| **API 接口维护** | 纯人肉录入 `sys_api`，极易与代码脱节 | 控制器/注解自反射自动扫描 | **契约驱动自动逆向**：从 `desc/*.api` 一键自动同步网关路由字典，零人工维护 |
| **数据范围权限** | 仅控制“能否点按钮/调接口”，管不了“能看谁的数据” | Spatie / FastAdmin 数据作用域（Data Scope） | **数据权限规则注入**：引入部门树 `sys_dept`，在 RPC Model 层动态拼接行级过滤 |
| **多用户体系** | 前后台共用一张表，存在越权与串号隐患 | Laravel Multi-Guards（多守卫体系） | **物理隔离**：拆分后台员工 `sys_user` 与 C 端会员 `user`，JWT 隔离鉴权 |
| **动态对象鉴权** | 无法处理“只能取消自己的未支付订单”等业务约束 | Laravel Gate & Policy 策略闭包 | **粗细粒度解耦**：网关只做粗粒度 403 路由拦截，微服务 Logic 做细粒度 ABAC 闭环 |
| **前端开发效率** | 复杂的动态路由与权限指令手写样板代码多 | 声明式资源管理 (Resource / Schema) | **ProComponents 生产力**：`ProLayout` 动态挂载后端菜单树 + 强类型 `<Access />` 按钮组件 |

### 1.2 核心参考开源标杆项目 (Reference Benchmark Projects)

本项目在架构设计与前端工程落地过程中，深度借鉴并融合了业界两大优秀开源工程的思想精髓：

#### 1. [LinaPro](https://github.com/linaproai/linapro)（后端权限、数据治理与审计体系标杆）
* **项目定位**：融合 PHP 生态成熟中后台（FastAdmin、ThinkAdmin、Laravel-Admin）十余年演进经验的现代企业级脚手架。
* **本项目核心吸收点**：
  1. **按钮与接口一体化联动模型 (Button-to-API Binding)**：打破“前端菜单一套、后端接口一套”的双重配置割裂，确立以 `sys_menu_api` 为核心枢纽，勾选按钮自动打通底层 API 的设计范式；
  2. **企业级双日志安全审计机制**：借鉴其操作日志（`sys_oper_log`）与登录日志（`sys_login_log`）的字段定义与追溯标准；
  3. **全局数据字典系统**：吸收其类型-数据项（`sys_dict_type` + `sys_dict_data`）解耦模型，实现状态标签、枚举与通用配置的全局统一分发；
  4. **多用户体系物理隔离 (Multi-Guard)**：严格区分管理后台员工（`sys_user`）与前台消费者（`user`），消除越权与串号隐患；
  5. **5 级数据权限作用域 (Data Scope)**：引入部门树（`sys_dept.ancestors`）祖级链检索机制，支持全部、自定义部门、本部门、本部门及以下、仅本人 5 级行级数据隔离。
* **本项目在 go-zero 微服务体系下的升维演进**：
  * 将单体架构升维为 **统一 HTTP 网关 (BFF) + 纯 gRPC 微服务集群**，通过 `mr.Finish` 跨服务并发聚合；
  * 将操作日志写入升级为 **Goroutine 异步 RPC 派发**，保障业务核心请求零时延阻塞（Zero-Overhead）；
  * 将 API 字典维护从人肉录入升级为 **IDL 契约逆向扫描与强类型 SDK 自动生成**。

#### 2. [Ant Design Pro](https://pro.ant.design)（前端中后台交互规范与体验设计标杆）
* **项目定位**：阿里巴巴出品的企业级开箱即用中后台前端全套解决方案。
* **本项目核心吸收点**：
  1. **统一页面容器规范 (`PageContainer`)**：全量页面抛弃裸 `div`，统一包裹 `<PageContainer>`，拉齐页头标题、副标题、面包屑导航与内边距排版标准；
  2. **多语言国际化体系 (i18n)**：对标 Pro 规范提供 `useIntl()` Hook 与 `formatMessage({ id, defaultMessage })` API，采用 `umi_locale` 作为 `localStorage` 持久化 Key，完美协同 Ant Design 6.x 底层 `<ConfigProvider locale={...}>`；
  3. **ProComponents 生产力套件**：
     * `ProLayout`：自适应顶部与侧边栏导航，内置深色/浅色主题一键切换；
     * `ProTable`：高度声明式的查询表单、列配置、密度缩放与全屏工具栏；
     * `ModalForm` / `DrawerForm`：弹窗表单与画像抽屉；
     * `StatisticCard` / `ProCard`：企业级指标面板与卡片切片；
  4. **声明式权限高阶组件 (`<Access />`)**：对标 `@umijs/plugin-access` 设计理念，提供 `hide`（隐藏）与 `disabled`（置灰+气泡提示）双模式权限受控组件；
  5. **企业级数据可视化集成**：整合 `@ant-design/charts` v2 平滑面积图、环形图与集群流量监控图表。

---

## 2. 总体架构设计与时序流转

### 2.1 整体架构拓扑

```mermaid
flowchart TD
    subgraph Client["前端多端工程体系 (Vite + Ant Design 6.x)"]
        Admin["apps/admin 管理后台"]
        Portal["apps/portal 官方门户"]
        AccessComp["<Access permission='user:add' mode='disabled' />"]
    end

    subgraph Gateway["统一 HTTP 网关 / BFF (端口 8888)"]
        JWTMiddleware["1. JWT 身份认证 (Guard 隔离校验)"]
        RBACMiddleware["2. RBAC 粗粒度授权 (Method + Path 比对)"]
        AutoScanner["3. 契约自动化扫描服务 (gateway.api -> sys_api)"]
    end

    subgraph Services["内部微服务集群 (纯 gRPC)"]
        UserRPC["user.rpc (用户、角色、部门、菜单权限、按钮绑定)"]
        OrderRPC["order.rpc (业务微服务，挂载 DataScope)"]
    end

    subgraph Storage["数据与缓存持久层"]
        MySQL[(MySQL 8.0 持久化存储)]
        Redis[(Redis 7 高性能权限缓存)]
    end

    Admin -->|"带 Bearer Token"| Gateway
    Portal -->|"带 Bearer Token"| Gateway
    Gateway -->|"gRPC Call (含 UserID, DeptID, DataScope)"| Services
    Services --> Storage
```

### 2.2 鉴权与业务执行时序

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 管理后台用户
    participant GW as Gateway 网关
    participant Redis as Redis 缓存
    participant RPC as 微服务 (user/order)
    participant DB as MySQL 数据库

    Admin->>GW: 发起业务请求 (携带 JWT Token)
    GW->>GW: 1. 解析 JWT，提取 userId, guard, roles
    GW->>Redis: 2. 校验 Redis Token 黑名单/版本号
    alt Token 已吊销或失效
        GW-->>Admin: 返回 HTTP 401 (前端拦截并跳回 /login)
    end
    GW->>Redis: 3. 查询当前用户允许访问的 API 规则库 (由角色授权的按钮间接联动)
    alt 当前 Path + Method 不在允许列表
        GW-->>Admin: 返回 HTTP 403 Forbidden
    end
    GW->>RPC: 4. 下发 gRPC 请求 (Context 注入 userId, deptId, dataScope)
    RPC->>RPC: 5. 校验对象级 Policy (如: 是否本部门/本人数据)
    RPC->>DB: 6. 携带 DataScope SQL 条件执行查询
    DB-->>RPC: 返回过滤后的业务数据
    RPC-->>GW: 返回 gRPC 响应
    GW-->>Admin: 统一标准封装返回 (result.HttpResult)
```

---

## 3. 按钮资源与前后端一体化联动设计 (Button-to-API Binding)

### 3.1 核心痛点：前端可见性与后端可调用性脱节

传统权限系统最致命的缺陷是：**把“前端菜单/按钮树”和“后端 API 列表”拆分成两张独立的勾选表让管理员配置**：
* 管理员给角色勾选了【删除订单】按钮，但**漏勾**了底层的 `DELETE /api/v1/order/delete` 接口，结果前端按钮看得见，一点就报 403；
* 反之，没勾按钮但配了接口，懂抓包的用户直接发请求即可绕过前端越权操作。

### 3.2 解决方案：按钮挂载接口，一石二鸟

本方案中，**按钮（Button / 权限点）作为连接前端 UI 与后端 API 的核心桥梁**：

```mermaid
flowchart LR
    subgraph MenuTree["菜单与权限树 (sys_menu)"]
        Dir["用户管理 (目录: type=1)"] --> Page["用户列表 (菜单: type=2)"]
        Page --> Btn1["新增按钮 (按钮: type=3)"]
        Page --> Btn2["编辑按钮 (按钮: type=3)"]
        Page --> Btn3["删除按钮 (按钮: type=3)"]
    end

    subgraph ApiResource["后端接口字典 (sys_api)"]
        Api1["POST /api/v1/user/create"]
        Api2["PUT /api/v1/user/update"]
        Api3["DELETE /api/v1/user/delete"]
    end

    Btn1 -.->|"sys_menu_api 绑定"| Api1
    Btn2 -.->|"sys_menu_api 绑定"| Api2
    Btn3 -.->|"sys_menu_api 绑定"| Api3

    subgraph Auth["角色授权体验 (管理后台一次勾选)"]
        Role["角色: 运营主管"] ==>|"只需勾选按钮"| Btn1
        Btn1 ===>|"自动生效"| UI_Auth["前端显示【新增用户】按钮"]
        Btn1 ===>|"底层自动联动"| API_Auth["网关放行 POST /api/v1/user/create"]
    end
```

* **统一授权视图**：管理员在后台角色授权弹窗中，面对的只有**一张完整的树形结构（目录 ➔ 菜单 ➔ 按钮）**；
* **联动自动赋权**：管理员勾选了某个按钮（例如【导出数据】），后端在保存 `sys_role_menu` 时，**自动根据 `sys_menu_api` 关联表，将该按钮对应的底层 API 批量授权给该角色**，无需管理员重复配置 API 列表，彻底杜绝遗漏！

### 3.3 前端按钮控制的两大展现策略 (Hide vs Disabled)

在 Ant Design Pro 中，业务场景对按钮权限的要求不仅是“无权限隐藏”，有时需要“无权限但置灰显示并提示原因”：

```tsx
// 策略 1：无权限直接不渲染 (默认模式，适合主操作或避免界面杂乱)
<Access permission="system:user:add">
  <Button type="primary" icon={<PlusOutlined />}>新增员工</Button>
</Access>

// 策略 2：无权限显示但置灰，悬浮提示 Tooltip (适合高风险操作，让用户感知功能存在但需要提权)
<Access 
  permission="system:user:delete" 
  mode="disabled" 
  disabledTip="您没有删除用户的操作权限，请联系部门管理员提权"
>
  <Button danger icon={<DeleteOutlined />}>删除员工</Button>
</Access>
```

### 3.4 强类型权限字典（杜绝手写字符串拼错）

在 `@zero/shared` 中集中导出强类型的常量对象，保障代码重构与 IDE 智能补全：

```typescript
// packages/shared/src/permissions.ts
export const PERMISSIONS = {
  USER: {
    VIEW: 'system:user:view',
    ADD: 'system:user:add',
    EDIT: 'system:user:edit',
    DELETE: 'system:user:delete',
    RESET_PWD: 'system:user:reset_pwd',
    EXPORT: 'system:user:export',
  },
  ORDER: {
    VIEW: 'order:view',
    AUDIT: 'order:audit',
    CANCEL: 'order:cancel',
    EXPORT: 'order:export',
  },
  ROLE: {
    VIEW: 'system:role:view',
    ASSIGN: 'system:role:assign',
  }
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];
```

### 3.5 核心设计辨析：为什么同时存在 sys_role_menu、sys_role_api 与 sys_menu_api？sys_menu_api 是否多余？

在设计 RBAC 权限系统时，常有开发者提出疑问：
> *“既然已经有了角色-菜单关联表 `sys_role_menu`，也有了角色-接口关联表 `sys_role_api`，那为什么还要冗余一张 `sys_menu_api`？它是不是多余的？”*

**直接结论：`sys_menu_api` 绝不仅不多余，恰恰相反，它是整个权限体系能够实现“自动化联动”和“业务与技术解耦”的核心发动机！** 如果从数据库纯三范式角度做减法，**能被省略的反而是 `sys_role_api`，而绝不能是 `sys_menu_api`**。

#### 1. 根本矛盾：业务视角 vs 技术视角的认知鸿沟
权限管理在企业中存在天然的“认知断层”：
* **业务视角（管理员/HR/业务主管）**：只理解**菜单与按钮**（如：“员工管理”、“新增员工”按钮）。他们只关心员工在屏幕上能看到什么、能点什么，**不懂也不关心底层 HTTP URL 和方法**。
* **技术视角（API 网关/微服务拦截切面）**：只理解 **HTTP Method + Path**（如：`POST /api/v1/system/users`）。网关只关心这次 HTTP 请求是否合法，**根本不知道也不在乎前端对应哪个按钮**。

👉 **`sys_menu_api` 正是填平“业务按钮”与“技术接口”这道鸿沟的唯一映射契约（Contract）！**

#### 2. 假设没有 sys_menu_api，系统会发生的灾难
如果删除了 `sys_menu_api`，只保留 `sys_role_menu` 和 `sys_role_api`：
* **噩梦般的双重人肉配置**：管理员在后台新建一个角色时，不仅要在“菜单权限”树里勾选【确认退款】按钮，还必须切换到“接口权限”Tab，在成百上千个技术 URL 中人肉搜索勾选 `POST /api/v1/order/refund/approve`。
* **极高的失误率（权限穿帮与越权漏洞）**：
  * **漏配接口**：勾了按钮却漏勾底层 API，用户在界面看到按钮，一点就报错 403 Forbidden；
  * **漏配按钮**：勾了 API 却漏勾按钮，懂技术的用户直接用 Postman 绕过前端界面越权调用。

> **有了 `sys_menu_api`**：
> “【确认退款】按钮（`menu_id: 101`）天然对应 `POST /api/v1/order/refund/approve`（`api_id: 55`）”这一技术契约在系统开发/初始化时就固化在 `sys_menu_api` 中。管理员在界面上勾选【确认退款】的瞬间，后端自动去查 `sys_menu_api`，秒级级联写入 `sys_role_api`。**管理员只需做业务勾选，底层防火墙自动打通！**

#### 3. 三张表的真实生命周期与分工矩阵

```text
               【系统设计 / 开发期】
              定义业务动作对应的技术资源
                     │
           ┌─────────▼─────────┐
           │   sys_menu_api    │ ◀───【元数据契约定义表 (Blueprint)】
           │  (按钮 ──> API)   │      低频维护，由开发者在建表初始化时确定
           └─────────┬─────────┘
                     │
         管理员在后台勾选角色权限（一石二鸟）
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────┐         ┌───────────────┐
│ sys_role_menu │         │ sys_role_api  │
│ (角色 ──> 菜单)│         │ (角色 ──> API) │
└───────┬───────┘         └───────┬───────┘
        │                         │
【前端渲染时读取】          【网关运行时读取】
控制页面菜单树与按钮显隐    每次请求毫秒级判定 403 (物化投影)
```

| 数据表 | 本质定位 | 维护时机与频率 | 核心回答的问题 | 消费方 |
| :--- | :--- | :--- | :--- | :--- |
| **`sys_menu_api`** | **元数据契约表 (Blueprint)** | 开发期 / 系统初始化（极低频） | *“这个按钮在技术上对应哪个后端接口？”* | 角色授权事务级联引擎 |
| **`sys_role_menu`** | **业务展示视图 (Presentation Scope)** | 角色授权时由管理员勾选（中频） | *“这个角色在前端界面能看到哪些菜单和按钮？”* | 前端登录画像与菜单树 |
| **`sys_role_api`** | **安全物化投影 (Security Materialized View)** | 由后端事务根据 `sys_menu_api` 自动计算写入 | *“这个角色到底能不能调用这个具体的 HTTP 路径？”* | 网关切面运行时毫秒级鉴权 |

#### 4. 为什么不直接用 sys_menu_api 动态 4 表 JOIN，而要保留 sys_role_api？
既然关系链是 `Role -> Menu -> Api`，为什么网关鉴权时不直接实时联表查询，而要持久化 `sys_role_api`？
* **空间换时间（网关极致高吞吐要求）**：网关每收到一次非 GET 请求，都要执行一次鉴权。
  * 若没有 `sys_role_api`，网关必须执行 4~5 张大表 JOIN（`sys_user_role -> sys_role -> sys_role_menu -> sys_menu_api -> sys_api`），在高并发下消耗大量 DB 连接池与 CPU；
  * 有了 `sys_role_api`，只查一张扁平表，连表极简，甚至可以整表直接放入 Redis Set（`SISMEMBER role:1:apis "POST:/api/v1/..."`）实现 **O(1) 毫秒级命中**。
* **支持“无前端界面”的纯后端 API 独立授权**：现实业务中，有些纯技术接口（如 Open API、Webhook 回调、批量同步管道）是没有前端界面按钮对应的。`sys_role_api` 既支持由按钮“一石二鸟”自动生成，又保留了未来直接为角色分配独立 API 权限的高级扩展通道。

---

## 4. 数据库与领域模型设计 (Data Models)

### 4.1 实体关系模型 (ER Diagram)

```mermaid
erDiagram
    sys_dept ||--o{ sys_user : "包含员工"
    sys_dept ||--o{ sys_dept : "上下级树形"
    sys_user ||--o{ sys_user_role : "拥有角色"
    sys_role ||--o{ sys_user_role : "分配给用户"
    sys_role ||--o{ sys_role_menu : "拥有菜单与按钮"
    sys_menu ||--o{ sys_role_menu : "分配给角色"
    sys_menu ||--o{ sys_menu_api : "按钮绑定接口"
    sys_api ||--o{ sys_menu_api : "被按钮绑定"
    sys_role ||--o{ sys_role_api : "直接API授权(可选备用)"
    sys_role ||--o{ sys_role_dept : "自定义数据范围"
    sys_dept ||--o{ sys_role_dept : "被角色授权部门"
```

### 4.2 完整生产级 MySQL DDL

```sql
-- ====================================================================
-- 企业级 RBAC、按钮资源与数据权限完整数据表结构
-- ====================================================================

-- 1. 组织机构 / 部门表 (支持层级树形与数据权限范围)
CREATE TABLE IF NOT EXISTS `sys_dept` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '部门ID',
    `parent_id` bigint NOT NULL DEFAULT 0 COMMENT '父部门ID (0为顶级)',
    `ancestors` varchar(500) NOT NULL DEFAULT '' COMMENT '祖级列表 (如: 0,1,5，便于层级检索)',
    `dept_name` varchar(50) NOT NULL COMMENT '部门名称',
    `sort` int NOT NULL DEFAULT 0 COMMENT '显示顺序',
    `leader` varchar(50) NOT NULL DEFAULT '' COMMENT '负责人',
    `phone` varchar(20) NOT NULL DEFAULT '' COMMENT '联系电话',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态 (1:正常 0:停用)',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组织机构部门表';

-- 2. 管理后台员工/用户表 (与前台 C 端 user 表物理隔离)
CREATE TABLE IF NOT EXISTS `sys_user` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '员工ID',
    `dept_id` bigint NOT NULL DEFAULT 0 COMMENT '归属部门ID',
    `username` varchar(50) NOT NULL COMMENT '登录账号',
    `password` varchar(100) NOT NULL COMMENT '密码哈希 (Bcrypt)',
    `real_name` varchar(50) NOT NULL DEFAULT '' COMMENT '真实姓名',
    `mobile` varchar(20) NOT NULL DEFAULT '' COMMENT '手机号码',
    `email` varchar(100) NOT NULL DEFAULT '' COMMENT '用户邮箱',
    `avatar` varchar(255) NOT NULL DEFAULT '' COMMENT '用户头像',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '账号状态 (1:正常 0:停用)',
    `token_version` int NOT NULL DEFAULT 1 COMMENT 'Token版本号 (用于强制下线/密码重置吊销)',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_username` (`username`),
    KEY `idx_dept_id` (`dept_id`),
    KEY `idx_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理后台系统用户表';

-- 3. 角色表 (包含功能权限与数据权限定义)
CREATE TABLE IF NOT EXISTS `sys_role` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '角色ID',
    `name` varchar(50) NOT NULL COMMENT '角色名称 (如: 销售总监)',
    `code` varchar(50) NOT NULL COMMENT '角色字符 (如: ROLE_SALES_DIRECTOR)',
    `sort` int NOT NULL DEFAULT 0 COMMENT '显示顺序',
    `data_scope` tinyint NOT NULL DEFAULT 1 COMMENT '数据范围 (1:全部 2:自定义部门 3:本部门 4:本部门及以下 5:仅本人)',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '角色状态 (1:正常 0:停用)',
    `description` varchar(255) NOT NULL DEFAULT '' COMMENT '备注描述',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统角色表';

-- 4. 菜单与按钮权限项字典表 (支持目录、菜单、按钮三级树)
CREATE TABLE IF NOT EXISTS `sys_menu` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '菜单/权限ID',
    `parent_id` bigint NOT NULL DEFAULT 0 COMMENT '父级ID (0为根目录)',
    `title` varchar(50) NOT NULL COMMENT '标题名称 (如: 新增用户)',
    `type` tinyint NOT NULL COMMENT '类型 (1:目录 2:菜单 3:按钮/权限点)',
    `path` varchar(200) NOT NULL DEFAULT '' COMMENT '前端路由地址 (菜单节点使用，如: /system/users)',
    `component` varchar(255) NOT NULL DEFAULT '' COMMENT '前端组件路径 (如: System/Users)',
    `permission_code` varchar(100) NOT NULL DEFAULT '' COMMENT '权限标识符 (按钮节点核心，如: system:user:add)',
    `icon` varchar(100) NOT NULL DEFAULT '' COMMENT '图标标识',
    `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
    `visible` tinyint NOT NULL DEFAULT 1 COMMENT '菜单是否显示 (1:显示 0:隐藏)',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态 (1:正常 0:停用)',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统菜单与按钮权限表';

-- 5. API 资源表 (与网关契约 gateway.api 联动自动化逆向生成)
CREATE TABLE IF NOT EXISTS `sys_api` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '接口ID',
    `api_group` varchar(50) NOT NULL COMMENT '所属业务域/分组 (如: user, order, system)',
    `title` varchar(100) NOT NULL COMMENT '接口名称描述',
    `path` varchar(200) NOT NULL COMMENT '网关路由 (如: /api/v1/user/info)',
    `method` varchar(10) NOT NULL COMMENT '请求方式 (GET, POST, PUT, DELETE)',
    `is_auto_sync` tinyint NOT NULL DEFAULT 1 COMMENT '是否契约自动同步生成 (1:是 0:人工维护)',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_path_method` (`path`, `method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网关后端接口资源表';

-- 6. 核心联动表：菜单/按钮与后端 API 绑定表 (一石二鸟关键底座)
CREATE TABLE IF NOT EXISTS `sys_menu_api` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `menu_id` bigint NOT NULL COMMENT '菜单/按钮ID (sys_menu.id，通常为type=3的按钮或type=2的页面)',
    `api_id` bigint NOT NULL COMMENT '接口ID (sys_api.id)',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_menu_api` (`menu_id`, `api_id`),
    KEY `idx_api_id` (`api_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单按钮与后端API接口绑定表';

-- 7. 关联授权表
CREATE TABLE IF NOT EXISTS `sys_user_role` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `role_id` bigint NOT NULL COMMENT '角色ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_user_role` (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

CREATE TABLE IF NOT EXISTS `sys_role_menu` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `role_id` bigint NOT NULL COMMENT '角色ID',
    `menu_id` bigint NOT NULL COMMENT '菜单/按钮ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_role_menu` (`role_id`, `menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色与菜单按钮关联表';

CREATE TABLE IF NOT EXISTS `sys_role_api` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `role_id` bigint NOT NULL COMMENT '角色ID',
    `api_id` bigint NOT NULL COMMENT '接口ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_role_api` (`role_id`, `api_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色与API权限关联表 (由分配菜单按钮时自动级联同步，亦可独立补充)';

CREATE TABLE IF NOT EXISTS `sys_role_dept` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `role_id` bigint NOT NULL COMMENT '角色ID',
    `dept_id` bigint NOT NULL COMMENT '部门ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_role_dept` (`role_id`, `dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色自定义数据范围部门关联表';
```

---

## 5. 后端与网关核心实现机制

### 5.1 契约驱动 API 自动逆向扫描器 (解决人肉维护痛点)

利用现有工具链，在执行 `just gen-gateway` 或自动化发布时，通过脚本自动扫描 `app/gateway/desc/*.api` 文件：
1. 正则或 AST 解析 `@server`、`@handler`、`@doc` 与路由声明；
2. 提取 `api_group`（如 `user`）、`title`（如 `@doc "用户注册"`）、`method`（`post`）、`path`（`/api/v1/user/register`）；
3. 执行 `INSERT INTO sys_api ... ON DUPLICATE KEY UPDATE` 写入数据库。
* **效果**：开发者只要在 `.api` 契约中定义完接口，管理后台的“API 资源列表”与“角色授权抽屉”便**自动出现该接口**，0 人工沟通成本与同步遗漏。

### 5.2 角色授权级联逻辑 (事务保证)

当管理员在界面上为角色保存菜单与按钮权限时，`user.rpc` 在一个 `m.Trans` 数据库事务内闭环：
```go
func (l *AssignRolePermissionsLogic) AssignRolePermissions(in *pb.AssignRolePermReq) error {
    return l.svcCtx.RoleModel.Trans(l.ctx, func(ctx context.Context, session sqlx.Session) error {
        // 1. 删除原有的 sys_role_menu
        // 2. 批量写入新的 sys_role_menu (包含目录、菜单和勾选的按钮节点)
        // 3. 核心级联：查询勾选的所有 menu_id 在 sys_menu_api 中绑定的 api_id 集合
        // 4. 自动覆盖更新 sys_role_api 关联表！
        // 5. 精准淘汰 Redis 权限缓存: DEL cache:auth:apis:{roleUsers}
        return nil
    })
}
```

### 5.3 网关鉴权中间件与微服务动态正则匹配

#### 1. 网关切面统一拦截：`RbacMiddleware` (`app/gateway/internal/middleware/rbac_middleware.go`)
统一网关全局挂载 `RbacMiddleware`，实现粗粒度 HTTP 路由防火墙：
```go
func (m *RbacMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions || isPublicRoute(r.URL.Path) {
			next(w, r)
			return
		}
		if !strings.HasPrefix(r.URL.Path, "/api/v1/system") {
			next(w, r)
			return
		}

		// 解析 Bearer JWT 提取 userId
		userId := m.extractUserId(r)
		if userId <= 0 {
			next(w, r)
			return
		}

		// 个人中心与基础认证接口放行
		if strings.HasPrefix(r.URL.Path, "/api/v1/system/personal") || strings.HasPrefix(r.URL.Path, "/api/v1/system/auth") {
			next(w, r)
			return
		}

		// 调用下游 UserRpc 微服务判定权限
		checkResp, err := m.svcCtx.UserRpc.CheckApiPermission(r.Context(), &userClient.CheckApiPermissionRequest{
			UserId: userId,
			Path:   r.URL.Path,
			Method: r.Method,
		})
		if err != nil || checkResp == nil || !checkResp.Allowed {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusForbidden)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"code": 403,
				"msg":  "权限不足，当前角色未被授予访问该接口的权限",
				"data": nil,
			})
			return
		}

		next(w, r)
	}
}
```

#### 2. 微服务智能正则匹配：`CheckApiPermissionLogic` (`app/user/rpc/internal/logic/user/checkapipermissionlogic.go`)
下游微服务不仅支持静态路径比对，更支持 RESTful 路径参数智能正则编译：
```go
var pathParamRegex = regexp.MustCompile(`:[a-zA-Z0-9_]+`)

func (l *CheckApiPermissionLogic) CheckApiPermission(in *pb.CheckApiPermissionRequest) (*pb.CheckApiPermissionResponse, error) {
	userId := in.UserId
	// 1. 超级管理员拥有全权通行证 (ID 为 1 或拥有 ROLE_ADMIN 角色)
	if userId == 1 || l.isSuperAdmin(userId) {
		return &pb.CheckApiPermissionResponse{Allowed: true}, nil
	}

	// 2. 查询当前员工名下所有启用的角色在 sys_role_api 中绑定的 API 列表
	apis, err := l.queryUserRoleApis(userId)
	if err != nil {
		return &pb.CheckApiPermissionResponse{Allowed: false}, nil
	}

	reqMethod := strings.ToUpper(strings.TrimSpace(in.Method))
	reqPath := strings.TrimSpace(in.Path)

	for _, api := range apis {
		if !strings.EqualFold(api.Method, reqMethod) {
			continue
		}
		// 精确匹配
		if api.Path == reqPath {
			return &pb.CheckApiPermissionResponse{Allowed: true}, nil
		}
		// RESTful 动态参数模糊匹配 (如将 /api/v1/system/dict/types/:id 自动转为 ^/api/v1/system/dict/types/[^/]+$)
		if strings.Contains(api.Path, ":") {
			pattern := "^" + pathParamRegex.ReplaceAllString(api.Path, `[^/]+`) + "$"
			if matched, _ := regexp.MatchString(pattern, reqPath); matched {
				return &pb.CheckApiPermissionResponse{Allowed: true}, nil
			}
		}
	}

	return &pb.CheckApiPermissionResponse{Allowed: false}, nil
}
```

### 5.4 数据权限作用域 (Data Scope) 在微服务中的落地

在业务微服务（如 `order.rpc`）执行列表查询时，结合当前用户的 `data_scope`：

```go
// OrderModelCustom.go
func (m *customOrdersModel) BuildDataScopeFilter(ctx context.Context, scope int, userDeptId int64, currentUserId int64) string {
    switch scope {
    case 1: // 全部数据权限
        return "1=1"
    case 3: // 本部门数据权限
        return fmt.Sprintf("dept_id = %d", userDeptId)
    case 4: // 本部门及以下数据权限
        return fmt.Sprintf("dept_id IN (SELECT id FROM sys_dept WHERE id = %d OR FIND_IN_SET(%d, ancestors))", userDeptId, userDeptId)
    case 5: // 仅本人数据权限
        return fmt.Sprintf("user_id = %d", currentUserId)
    default:
        return "1=2" // 无权限兜底
    }
}
```

---

## 6. 前端 Ant Design Pro 落地实现

### 6.1 动态菜单与动态路由 (Dynamic ProLayout)

在 `apps/admin/src/layouts/BasicLayout.tsx` 中，将静态的 `routeConfig` 切换为接口动态下发：

```tsx
<ProLayout
  {...settings}
  // 动态由网关获取当前用户拥有的菜单树 (过滤掉 type === 3 的按钮，只保留目录和页面菜单)
  menu={{
    params: { userId: currentUser?.id },
    request: async () => {
      const userMenus = await getUserMenuTree();
      return transformToProMenu(userMenus);
    },
  }}
  menuItemRender={(item, dom) => (
    <div onClick={() => item.path && navigate(item.path)}>
      {dom}
    </div>
  )}
>
  <Outlet />
</ProLayout>
```

### 6.2 完善的 `<Access />` 按钮组件实现

在 `apps/admin/src/components/Access.tsx` 封装权限高阶组件，同时支持 `hide` 和 `disabled` 两种展现策略：

```tsx
import React from 'react';
import { Tooltip } from 'antd';
import { useAuth } from '../contexts/AuthContext';

interface AccessProps {
  permission: string | string[];
  mode?: 'hide' | 'disabled';
  disabledTip?: string;
  fallback?: React.ReactNode;
  children: React.ReactElement;
}

export const Access: React.FC<AccessProps> = ({
  permission,
  mode = 'hide',
  disabledTip = '暂无操作权限',
  fallback = null,
  children,
}) => {
  const { permissions, isSuperAdmin } = useAuth();

  if (isSuperAdmin) {
    return children;
  }

  const requiredList = Array.isArray(permission) ? permission : [permission];
  const hasAuth = requiredList.some(code => permissions.includes(code));

  if (hasAuth) {
    return children;
  }

  // 模式一：无权限隐藏
  if (mode === 'hide') {
    return <>{fallback}</>;
  }

  // 模式二：无权限显示但置灰，悬浮提示 Tooltip
  return (
    <Tooltip title={disabledTip}>
      <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
        {React.cloneElement(children, {
          disabled: true,
          style: { ...children.props.style, pointerEvents: 'none' },
        })}
      </span>
    </Tooltip>
  );
};
```

### 6.3 ProComponents CRUD 标准交互示范

依托已经搭载的 `@ant-design/pro-components`，四大模块的生产力大幅提升：
1. **用户管理 (`/system/users`)**：
   * `<ProTable<SysUserItem> />`：支持部门树树形穿梭过滤、状态快捷开关（Switch）、批量重置密码；
   * `<ModalForm />`：新增/编辑员工，支持表单分组联动。
2. **角色管理 (`/system/roles`)**：
   * `<ProTable<SysRoleItem> />`：列表展示；
   * 点击“授权”弹窗：使用 Ant Design `<Tree checkable />` 展示包含【目录-菜单-按钮】的全量统一权限树，勾选即自动打通底层接口。
3. **菜单与按钮管理 (`/system/menus`)**：
   * 表格直接设置 `expandable` 树形嵌套展示；
   * 区别渲染“目录 / 菜单 / 按钮”高亮 Tag 标签，直观维护 `permission_code`；
   * 在按钮节点右侧提供“关联 API”快捷入口（支持多选绑定的后端 API）。
4. **接口字典 (`/system/apis`)**：
   * 支持通过按钮“一键从网关契约同步”，自动比对代码库中的最新 `.api` 文件与数据库差异。

---

## 7. 落地实施状态与验证 (Implementation Status)

本方案已 **100% 完整落地并合并至工程代码库**：

* [x] **Phase 1: 数据库与持久层就绪 (Completed)**
  * 在 `manifest/sql/init.sql` 与 `manifest/sql/rbac_schema.sql` 中固化 DDL（含 `sys_menu_api` 与全量索引）；
  * 执行 `just gen-model all` 生成带 Redis Cache-Aside 的 Go Model 代码（`app/user/model/`）。
* [x] **Phase 2: 微服务与契约生成 (Completed)**
  * 扩展 `app/user/rpc/user.proto`，提供角色分配、菜单树、API 校验等 RPC 方法（使用 `m.Trans` 级联维护角色-菜单-接口关联）；
  * 编写 `app/gateway/desc/system.api` 契约，执行 `just gen-gateway` 和 `just gen-ts` 生成 `@zero/api`。
* [x] **Phase 3: 网关鉴权切面与微服务校验 (Completed)**
  * 在统一网关挂载 `RbacMiddleware` (`app/gateway/internal/middleware/rbac_middleware.go`)；
  * 下游微服务 `CheckApiPermissionLogic` 实现智能 RESTful 路径参数正则匹配。
* [x] **Phase 4: 前端 ProTable 与动态权限组件 (Completed)**
  * 在 `@zero/shared` 中固化强类型 `PERMISSIONS` 字典；
  * `AuthContext` 注入 `permissions` 与 `menus`，`BasicLayout` 动态装载侧边栏；
  * 全局封装 `<Access />` 按钮权限组件（支持 hide 与 disabled 悬浮气泡模式）；
  * 完成用户管理、角色管理、菜单管理、接口字典四大 ProTable 模块，100% 遵循 Ant Design 6.x 规范。