## Why

当前 `frontend/apps/admin` 与 `frontend/apps/portal` 的前端路由体系存在硬编码与双头维护问题：
1. 路由定义在 `router/index.tsx` 或 `App.tsx` 中使用 JSX 标签硬编码，而菜单结构又在 `BasicLayout.tsx` / `PortalLayout.tsx` 中手写了一份配置，违反了 DRY 原则；
2. 页面组件全量同步导入，缺乏基于 `React.lazy` / `Suspense` 的按需代码分割，随着业务页面增多会明显拖慢首屏加载速度；
3. 缺少前端路由级的声明式权限拦截（仅在侧边栏依靠后端菜单树隐藏，若用户在地址栏手动输入未授权 URL 仍会直接访问页面）。

借鉴 Ant Design Pro 的“编译时声明式路由配置 + 运行时上下文与布局注入 + 声明式权限判定”的成熟工程规范，通过轻量级、无黑盒的原生 Vite + React 18 + React Router 方案对 `admin` 与 `portal` 的路由体系进行彻底重构优化。

## What Changes

- **统一声明式编译时路由表 (`config/routes.ts`)**：
  - 在 `admin` 和 `portal` 中分别抽离声明式路由配置文件，集中定义路径、组件懒加载（`React.lazy`）、Icon、国际化多语言 Key、权限标识（`access`）及子路由嵌套。
  - 在 `@zero/shared` 或应用内定义通用的 `AppRouteItem`、`RouteMeta` 强类型定义。
- **页面级按需代码分割与加载骨架**：
  - 所有页面组件全面改造为 `React.lazy` 动态导入。
  - 提供统一的 `PageLoading` 骨架组件与 `<Suspense>` 兜底。
- **声明式权限判定与路由级阻断 (`access.ts` + 路由守卫)**：
  - 在 `admin` 中引入类似 Ant Design Pro 的 `access.ts` 权限管理模块，支持基于 `permissions` 集合与 `isSuperAdmin` 判定。
  - 当无权限用户在浏览器地址栏手动访问受保护路径时，路由拦截器直接阻断并呈现友好的 Ant Design 403 缺省页。
- **通用路由渲染器 (`RouteRenderer.tsx`)**：
  - 实现自顶向下的通用路由树解析器，将声明式 `routes.ts` 自动递归转换为 React Router `<Route>` 结构。
  - 直接复用声明式路由树为 ProLayout 的 `route` 属性提供数据源，彻底移除 `BasicLayout` 和 `PortalLayout` 中重复硬编码的路由兜底对象。
- **运行时配置与应用初始化 (`src/app.tsx`)**：
  - 规范化运行时全局生命周期与初始状态（`getInitialState`），统一管理登录凭证、用户信息画像与动态菜单拉取。

## Capabilities

### New Capabilities
- `frontend-routing`: 统一声明式编译时路由配置、自动按需代码分割懒加载（`React.lazy` + `Suspense`）、通用路由树渲染器（`RouteRenderer`）及 ProLayout 数据源复用，覆盖 `admin` 与 `portal`。
- `frontend-access-control`: 统一声明式前端权限控制与路由守卫体系，基于权限编码（`access`）和角色画像在路由层实现 URL 级 403 访问阻断与侧边栏权限联动。

### Modified Capabilities
<!-- 无已有 capabilities，首次引入 -->

## Impact

- **Affected Applications**:
  - `frontend/apps/admin`: 重构 `src/router/`、`src/layouts/BasicLayout.tsx`、新增 `src/config/routes.ts`、`src/access.ts`、`src/app.tsx`。
  - `frontend/apps/portal`: 重构 `src/App.tsx`、`src/layouts/PortalLayout.tsx`、新增 `src/config/routes.ts`、`src/router/RouteRenderer.tsx`。
  - `frontend/packages/shared`: 可复用通用的路由元数据类型 `AppRouteItem`。
- **Dependencies**: 纯原生 React 18 + React Router + Ant Design / ProComponents，无需引入额外三方依赖。
- **Breaking Changes**: 无破坏性 API 变更，对外对外暴露的页面 URL 保持 100% 兼容。
