# Proposal: 声明式按钮级权限组件与 Hook (<Access> / useAccess)

## 1. 背景与动机
在企业级中后台开发中（对标 Ant Design Pro、LinaPro 与 Ruoyi），除路由级粗粒度鉴权外，页面内的细粒度功能权限（如表格工具栏的“新建”、“导出”、“批量删除”，以及每行数据操作列的“编辑”、“授权”、“删除”）是高频刚需。

当前项目中虽然有基于 `currentUser` 的 `getAccess()` 引擎与分散的 `initialState.permissions` 数组，但存在以下痛点：
1. 缺乏统一且对齐 Ant Design Pro 规范的 `useAccess()` Hook，开发者判断权限代码繁琐；
2. 现有 `Access.tsx` 组件引用了未挂载的 `useAuth()`，未能与全局单根 `InitialStateProvider` 打通；
3. 缺少灵活的权限降级展示策略（不仅支持无权限隐藏 `hide`，还支持无权限禁用+气泡说明 `disabled`）。

## 2. 核心方案与交付物
1. **`useAccess` 核心 Hook**：
   - 深入结合 `InitialStateContext` 与 `src/access.ts`；
   - 暴露 `canAccess(code)`、`hasPermission(perm, mode)`、`hasRole(role, mode)`、`canAdmin`、`isSuperAdmin`、`permissions`、`roles`。
2. **声明式 `<Access>` 组件全面升级**：
   - 支持 `accessible?: boolean`（布尔判断模式）；
   - 支持 `permission?: string | string[]`（直接传入权限标识，如 `PERMISSIONS.USER_ADD`）；
   - 支持 `role?: string | string[]`（角色判定模式）；
   - 支持 `mode?: "all" | "one"`（多权限与/或判断）；
   - 支持 `fallbackMode?: "hide" | "disabled"`（隐藏或禁用气泡态）；
   - 支持 `fallbackTooltip` 与自定义 `fallback` 节点；
   - 导出为 `@/components/Access` 与统一导出 `src/components/index.ts`。
3. **真实业务页面示范集成**：
   - 在系统管理关键页面（`System/Users` 或 `System/Dept` 等）采用 `<Access>` 声明式包裹新增与删除按钮，提供生产级示例。
4. **单元测试与质量保障**：
   - 编写 `frontend/apps/admin/tests/accessComponent.test.tsx` 与 `useAccess.test.tsx`，覆盖各种权限与降级场景；
   - 运行 `just lint-antd` 与 `just test-frontend` 确保 100% 验收通过。
