## Context

当前项目的统一 HTTP 网关（`app/gateway`）对外暴露 RESTful 接口，在入口处全局挂载 `RbacMiddleware`，鉴权逻辑主要依赖将当前请求的 HTTP Method 与 URL 路径转换为正则表达式后，向下游 `user.rpc` 的 `CheckApiPermission` 发起匹配。

虽然这套机制有效实现了粗粒度拦截，但当重构接口 URL 时易导致权限失效，且业务代码中缺乏编译期类型安全保障，数据库 `sys_menu` 按钮权限点依然需要人工录入。设计详见 `proposal.md`。

## Goals / Non-Goals

**Goals:**
- 构建按 Group 模块化切分但统一归属于 `package perm` 的强类型常量包；
- 设计统一入参结构体 `perm.PermissionRequired{ Permission, All, Any }`，并将所有判决逻辑收敛于 `svcCtx.RbacService.Check` 单一函数；
- 定制 goctl `handler.tpl` 模板，在代码生成期静态注入常量与结构体调用，消除运行时反射开销；
- 提供无需查询数据库的内存级 `perm.All()` 与 `perm.AllCodes()` 自导出能力，并在网关暴露 `GET /api/v1/system/auth/permissions`；
- 前端 `@zero/shared` 同步强类型权限字典，增强 `<Access>` 组件与 `useAccess` Hook 支持复合 `hasAll` / `hasAny`。

**Non-Goals:**
- 不废弃现有的 `sys_menu` / `sys_role` 权限表，现有数据库依然作为角色-权限映射关系的持久化载体；
- 本次变更不包含数据范围权限（Data Scope 行级过滤）的重构，数据范围权限依然在微服务 RPC Logic 层生效。

## Decisions

### 1. 文件按 Group 拆分但统一归属于 `package perm` 命名空间
- **决策**：在 `app/gateway/internal/perm/` 下拆分 `user.go`、`dict.go`、`itsm.go` 等文件，但所有文件头部均声明 `package perm`。
- **理由**：
  - 调用方只需一次性 `import ".../internal/perm"`，享受统一的 IDE 智能联想；
  - 允许跨 Group 常量自由混用（例如在导出接口中同时引用 `perm.UserList` 与 `perm.SystemExport`），彻底避免子包循环依赖（Import Cycle）。
- **备选方案**：按子包拆分（如 `perm/user`、`perm/dict`），这会导致复杂的跨包导入与命名空间割裂。

### 2. 统一参数对象 (`PermissionRequired`) 与单一门面入口 (`Check`)
- **决策**：定义包含 `Permission string`、`All []string`、`Any []string` 的结构体，并在网关 `RbacService` 中提供单一判定方法 `Check(ctx context.Context, req perm.PermissionRequired) error`。
- **理由**：
  - **模板代码极简化**：`handler.tpl` 不需要写复杂的 `if-else` 分支去拼装不同的方法，所有 Handler 结构完全一致；
  - **业务逻辑内聚**：超管全局豁免、AND 逻辑、OR 逻辑、未配置兜底以及未来可能增加的审计日志全部在 `Check` 方法内闭环，未来规则升级不需要重新 `goctl` 生成数百个 Handler。
- **备选方案**：在模板中通过条件判断分别生成 `HasPermission`、`HasAll`、`HasAny`，这会导致模板臃肿脆弱，且无法优雅处理未配置权限的接口。

### 3. 未配置权限接口的双模安全兜底（Default Deny）
- **决策**：
  - 若 `req.IsEmpty()` 为 true（未声明任何权限），优先检查是否属于显式公开白名单（如登录、验证码）；
  - 若非白名单接口，**自动回退至网关原有的 `Method + Path` 正则规则库进行校验**。如果角色未被明确授权该 URL，坚决返回 403 拦截。
- **理由**：防止开发者新增接口时疏忽漏标权限导致越权漏洞，同时保持与现有历史接口 100% 平滑兼容。

### 4. 模块 `init()` 自描述注册与内存自导出
- **决策**：每个 `perm/<group>.go` 文件通过 `init()` 将其包含的常量、编码及中文名称注册到 `registry.go` 的读写锁聚合池中。网关提供 `GET /api/v1/system/auth/permissions` 直接返回 `perm.All()`。
- **理由**：
  - 零数据库查询，响应时间在微秒级；
  - 代码即唯一真实源，前端角色授权抽屉直接调用该接口渲染 Ant Design `Tree`，彻底消除手动录入 `sys_menu` 的繁重工作。

## Risks / Trade-offs

- **[开发者漏写权限标注]** → **缓解方案**：`Check` 函数对未配置接口采用默认拦截与正则兜底，同时在 `just gen-gateway` 中挂载 Linter 提示未配置权限的 JWT 接口。
- **[切片遍历的性能损耗]** → **缓解方案**：单接口的 `All` 或 `Any` 权限切片通常只有 2-3 项，且当前用户的已授权权限在上下文中由 `map[string]struct{}` 维护，单次查找时间复杂度为 O(1)，全流程耗时在十纳秒级别。
- **[前端多包同步成本]** → **缓解方案**：将权限常量输出至 Monorepo 根共享包 `@zero/shared`，`admin` 和 `portal` 通过 pnpm workspace 直接引用，无发布等待。

## Migration Plan

1. **第一阶段（底座就位）**：创建 `internal/perm/` 模块，包含 `types.go`、`registry.go` 及核心业务常量文件，并在 `RbacService` 中实现 `Check` 逻辑与单元测试。
2. **第二阶段（模板定制与试点）**：在 `template/api/handler.tpl` 中植入 `perm.PermissionRequired` 调用，在 `user.api` 和 `dict.api` 中标注 `@doc` 权限点并重新生成 Handler，验证编译通过与鉴权正确。
3. **第三阶段（自导出与全网关铺开）**：在 `gateway.api` 暴露 `GET /api/v1/system/auth/permissions`，为其余管理模块补充权限标注。
4. **第四阶段（前端对齐）**：在 `@zero/shared` 导出 `PERMISSIONS`，增强 `<Access>` 组件并更新角色管理界面的授权树组件。
