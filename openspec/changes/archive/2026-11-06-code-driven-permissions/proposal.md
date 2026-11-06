## Why

当前网关鉴权主要依赖基于 `Method + Path` 的 RESTful URL 动态正则匹配。在实际中后台工程演进中存在三大痛点：
1. **URL 重构脆弱性**：修改接口路由会导致既有数据库权限映射失效报 403；
2. **魔法字符串与拼写风险**：权限标识分散在业务与数据库中，缺乏编译期类型检查，拼写手滑无法提早暴露；
3. **缺乏代码级单一真理源**：角色授权树需人肉在数据库中维护 `sys_menu` 按钮记录，前后端权限命名空间容易脱节。

通过引入类似 GoFrame v2 的就近声明模式，并在 go-zero 体系下升维为“编译期强类型静态常量注入 + 统一门面判决 (`Check`) + 全量权限元数据自导出”，实现类型安全、零运行时反射、前后端 100% 同构的代码驱动权限体系。

## What Changes

- **新增强类型权限常量包 (`app/gateway/internal/perm`)**：
  - 按业务 Group 模块化切分（`user.go`、`dict.go`、`itsm.go` 等），统一挂载在 `package perm` 命名空间；
  - 声明 `PermissionRequired{ Permission, All, Any }` 统一规则结构体，收敛 AND/OR 多权限场景；
  - 提供 `registry.go` 聚合注册池与 `perm.All()` / `perm.AllCodes()` 导出函数。
- **扩展网关鉴权判决引擎 (`svcCtx.RbacService.Check`)**：
  - 收敛权限判决逻辑至单一方法，自适应处理单权限、全部满足 (AND)、任一满足 (OR) 与空结构体未配置场景；
  - 对未配置权限点的受保护接口提供安全白名单放行与既有网关路由正则兜底（Default Deny 机制）。
- **定制 goctl 代码生成模板 (`handler.tpl`)**：
  - 读取 `.api` 中 `@doc(permission / permission_all / permission_any)` 声明；
  - 在生成的 Handler 中静态注入 `perm.PermissionRequired` 与 `perm.Xxx` 常量调用。
- **新增全量权限树查询接口**：
  - 在网关暴露 `GET /api/v1/system/auth/permissions`，内存级纳秒返回结构化权限树；
  - 管理后台角色授权弹窗直接使用该接口渲染 Ant Design `Tree` 勾选树。
- **前端 `@zero/shared` 常量同步与 `<Access>` 多权限扩展**：
  - 导出 TypeScript 强类型 `PERMISSIONS` 对象；
  - 扩展 `useAccess` 增加 `hasAll` 与 `hasAny` 多权限判定能力。

## Capabilities

### New Capabilities
- `code-driven-permissions`: 提供基于编译期强类型常量的权限点管理、统一门面判决引擎（支持单权限/AND/OR）、自描述注册池与元数据导出 API。

### Modified Capabilities
- `declarative-access`: 增强前端权限判定引擎，增加 `hasAll` 和 `hasAny` 复合权限判断，并支持强类型常量对象绑定。

## Impact

- **后端代码**：新增 `app/gateway/internal/perm/` 模块，调整网关 `RbacService` 鉴权逻辑，更新 `handler.tpl` 模板。
- **API 契约**：在 `app/gateway/desc/` 中为核心管理接口补充 `@doc` 权限标注，新增 `GET /api/v1/system/auth/permissions` 路由。
- **前端代码**：更新 `@zero/shared` 权限定义，增强 `frontend/apps/admin` 的 `<Access>` 与角色授权树组件。
- **向后兼容性**：完全向后兼容现有的 JWT 和基于 `Method + Path` 的正则权限库兜底。
