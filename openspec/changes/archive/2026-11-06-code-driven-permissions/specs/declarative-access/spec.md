## MODIFIED Requirements

### Requirement: useAccess 权限状态提取 Hook
系统 SHALL 提供 `useAccess()` Hook，自动从全局 InitialState 中提取当前用户角色与权限集并结合 `getAccess()` 判定引擎，支持单权限、复合全部满足 (`hasAll`) 与复合任一满足 (`hasAny`) 判定。

#### Scenario: 普通用户权限判定
- **WHEN** 普通用户调用 `hasPermission('system:user:add')`
- **THEN** 若用户权限列表中包含该权限返回 `true`，否则返回 `false`

#### Scenario: 复合全部权限判定 hasAll
- **WHEN** 用户调用 `hasAll('system:user:list', 'system:user:export')`
- **THEN** 仅当用户权限列表同时包含传入的所有权限码时返回 `true`，否则返回 `false`

#### Scenario: 复合任一权限判定 hasAny
- **WHEN** 用户调用 `hasAny('system:user:list', 'system:order:manage')`
- **THEN** 只要用户权限列表包含传入的任意一个权限码即返回 `true`，全不包含返回 `false`

#### Scenario: 超级管理员全局豁免
- **WHEN** 当前用户具有超级管理员身份（`id === 1` 或拥有 `ROLE_ADMIN` / `admin` 角色）
- **THEN** 所有的 `hasPermission`、`hasAll`、`hasAny` 与 `hasRole` 判定均自动放行返回 `true`

## ADDED Requirements

### Requirement: 共享强类型权限常量绑定
系统 `@zero/shared` SHALL 导出与后端对齐的只读常量字典 `PERMISSIONS`，供前端 `<Access>` 组件与权限钩子直接绑定。

#### Scenario: 强类型权限绑定渲染
- **WHEN** 开发者使用 `<Access permission={PERMISSIONS.USER.CREATE}>` 进行组件受控控制
- **THEN** 编译期享受 TypeScript 类型提示，避免手写字符串字面量导致的命名不一致
