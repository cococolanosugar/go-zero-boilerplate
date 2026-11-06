## 1. 基础常量与注册中心基础设施

- [x] 1.1 创建 `app/gateway/internal/perm/types.go`，定义 `PermissionRequired` 结构体（包含 `Permission`、`All`、`Any`）与 `IsEmpty()` 方法，并编写单测验证行为
- [x] 1.2 创建 `app/gateway/internal/perm/registry.go`，定义 `Item`、`Group` 结构体及并发安全的 `RegisterGroup`、`All()`、`AllCodes()` 函数，并编写测试验证自注册与导出逻辑
- [x] 1.3 编写按 Group 切分的常量文件（`user.go`、`dict.go`、`itsm.go` 等），在各模块 `init()` 中注册元数据并验证 `go build ./app/gateway/...` 编译通过

## 2. 网关鉴权门面与核心判决引擎

- [x] 2.1 在网关鉴权层实现 `Check(ctx context.Context, req perm.PermissionRequired) error`，支持单权限、All (AND)、Any (OR) 及超级管理员全局豁免
- [x] 2.2 实现未配置权限点（`req.IsEmpty()`）的白名单放行与 `sys_menu_api` 动态正则兜底逻辑，编写单元测试覆盖 5 种授权场景
- [x] 2.3 在 `app/gateway/desc/` 中声明全量权限树接口 `GET /api/v1/system/auth/permissions`，实现其 Handler/Logic 并验证返回 `perm.All()` 结构化数据

## 3. goctl 模板定制与代码生成验证

- [x] 3.1 定制 goctl API 代码生成模板 `handler.tpl`，使生成代码注入 `svcCtx.RbacService.Check(r.Context(), perm.PermissionRequired{...})` 调用
- [x] 3.2 在核心模块契约（`user.api`、`dict.api`）中补充 `@doc` 权限标注，执行 `just gen-gateway` 重新生成 Handler 并验证编译与测试 100% 通过
- [x] 3.3 编写网关 HTTP 接口测试，验证配置了权限点的接口在有权（200）、无权（403）及未配置情况下的行为表现

## 4. 前端强类型常量同步与组件增强

- [x] 4.1 在 `frontend/packages/shared/src/constants/permissions.ts` 中导出与后端对齐的 `PERMISSIONS` 强类型常量对象
- [x] 4.2 增强 `useAccess` Hook 与 `<Access>` 组件，支持 `hasAll` 与 `hasAny` 复合权限判断，并运行 `just test-frontend` 验证通过
- [x] 4.3 在 `frontend/apps/admin` 的角色权限分配界面对接 `GET /api/v1/system/auth/permissions`，渲染 Ant Design `Tree` 权限树并验证授权数据流转
