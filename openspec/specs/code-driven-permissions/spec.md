# code-driven-permissions Specification

## Purpose

为基于 go-zero 构建的企业级全栈系统提供基于强类型常量的权限点管理、统一门面判决引擎（支持单权限、多权限 AND、多权限 OR）、自描述注册池与面向前端的元数据自导出能力。

## Requirements

### Requirement: 强类型权限常量定义与分组注册
系统 SHALL 提供按业务 Group 模块化拆分的强类型权限字符串常量，并在同属于 `package perm` 命名空间下向全局注册池自注册其编码与显示元数据。

#### Scenario: 模块常量定义与编译期检查
- **WHEN** 开发者在 `app/gateway/internal/perm/<group>.go` 中定义常量
- **THEN** 该常量可在 Handler 模板中直接以 `perm.Xxx` 方式引用，若常量不存在或拼写错误将在 `go build` 阶段直接阻断编译

#### Scenario: 权限元数据自注册
- **WHEN** 服务启动并执行各模块的 `init()` 函数
- **THEN** 该模块下的权限标识 `Code` 与展示名称 `Name` 将自动注册到全局内存注册池中，且各模块文件互相解耦

### Requirement: 统一权限判决引擎 (Check)
系统网关鉴权服务 SHALL 提供接收 `perm.PermissionRequired` 参数对象的统一 `Check(ctx, req)` 判决方法，支持单权限、复合 AND 权限与复合 OR 权限。

#### Scenario: 单权限校验通过
- **WHEN** 接口配置 `Permission: perm.UserCreate` 且当前用户持有该权限标识
- **THEN** `Check` 函数返回 `nil`，允许请求流转进入下游业务 Logic

#### Scenario: 单权限校验未通过
- **WHEN** 接口配置 `Permission: perm.UserCreate` 且当前用户未持有该权限标识
- **THEN** `Check` 函数返回 `xerr.ErrForbidden`（HTTP 403），立即终止请求

#### Scenario: 复合 AND 权限校验 (All)
- **WHEN** 接口配置 `All: []string{perm.UserList, perm.UserExport}`
- **THEN** 仅当当前用户同时拥有列表中所有权限标识时判定通过；任一缺失则返回 403 异常

#### Scenario: 复合 OR 权限校验 (Any)
- **WHEN** 接口配置 `Any: []string{perm.UserList, perm.OrderManage}`
- **THEN** 只要当前用户持有列表中任意一个权限标识即判定通过；全部不满足则返回 403 异常

#### Scenario: 超级管理员全局豁免
- **WHEN** 当前请求用户具有超级管理员身份（拥有 `*` 标识或 `ROLE_ADMIN` 角色）
- **THEN** 所有的单权限、AND 复合权限与 OR 复合权限判定均无条件直接通过

### Requirement: 未配置权限点的安全防护与兜底
对于挂载了 JWT 认证但未配置 `permission`、`all` 或 `any` 的接口，系统 SHALL 实行默认防御策略（Default Deny）。

#### Scenario: 未配置接口安全拦截与白名单放行
- **WHEN** 传入的 `perm.PermissionRequired` 为空结构体
- **THEN** 若该路由不在公开白名单中，且网关原有 `Method + Path` 规则库未明确授权该角色，则严格返回 403 禁止访问，防止漏配产生越权漏洞

### Requirement: 全量权限元数据导出 API
系统网关 SHALL 提供无需查库的内存级权限树导出接口，供前端角色分配与权限字典初始化消费。

#### Scenario: 请求全量权限树接口
- **WHEN** 客户端调用 `GET /api/v1/system/auth/permissions`
- **THEN** 网关直接调用 `perm.All()` 返回包含模块 Key、模块 Title 及包含 Code 与 Name 的树状权限分组列表，响应时延为微秒级
