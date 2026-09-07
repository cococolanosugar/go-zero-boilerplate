## Context

当前项目采用 Vite + React 18 + React Router v6 + Ant Design 6 / ProComponents 架构。在 `frontend/apps/admin` 与 `frontend/apps/portal` 中，路由和菜单均分散硬编码在各自的 `App.tsx`、`router/index.tsx`、`BasicLayout.tsx` 与 `PortalLayout.tsx` 中。详见 [proposal.md](proposal.md) 的背景与问题分析。

## Goals / Non-Goals

**Goals:**
- 提供声明式编译时路由配置文件 `config/routes.ts`，作为路由注册与菜单展示的唯一事实源（Single Source of Truth）。
- 对所有页面级组件实施 `React.lazy()` 代码分割与按需加载，并搭配全局统一的 `PageLoading` 占位组件。
- 构建递归通用的 `RouteRenderer`，自动将声明式路由表转换为 React Router v6 路由树，兼顾布局挂载、重定向、404 兜底与权限拦截。
- 引入类似 Ant Design Pro 的 `access.ts` 声明式权限控制，实现 URL 级 403 页面级阻断，并在侧边栏联动过滤未授权项。
- 抽取统一的运行时初始化上下文（`getInitialState`），规范登录态、用户信息与动态菜单拉取。

**Non-Goals:**
- 不引入重型的 UmiJS / `@umijs/max` 框架依赖，完全基于纯净的 Vite + 原生 React Router 机制实现，维持项目的轻量与透明度。
- 不改变后端 gRPC 微服务、网关 BFF 的任何已有 API 契约。
- 不修改各业务页面（如订单、用户、字典等）内部的表单与表格交互逻辑。

## Decisions

### 1. 路由配置数据结构定义
在 `@zero/shared` 或各 App 的 `config/routes.types.ts` 中定义通用的 `AppRouteItem`：
```typescript
export interface AppRouteItem {
  path: string;
  name?: string;               // 菜单展示名称
  locale?: string;             // 国际化多语言 key
  icon?: React.ReactNode | string; // 图标组件或图标标识
  component?: React.ComponentType<any> | React.LazyExoticComponent<any>;
  redirect?: string;           // 重定向路径
  layout?: boolean;            // 是否包裹在外层 Shell Layout 中，默认 true
  public?: boolean;            // 是否公开可访问（跳过登录守卫）
  access?: string;             // 权限码标识，如 'system:user:list'
  hideInMenu?: boolean;        // 是否在菜单栏隐藏
  routes?: AppRouteItem[];     // 嵌套子路由
}
```
*Rationale*: 该结构高度对齐 Ant Design Pro 官方路由规范，同时天然适配 ProLayout 的 `route` 属性输入。

### 2. 原生 React.lazy + Suspense 代码分割
所有页面在 `config/routes.ts` 中通过：
```typescript
component: lazy(() => import("../pages/Orders"))
```
方式进行按需引入，配合轻量级 `<PageLoading />` 骨架组件。
*Rationale*: Vite 天然支持基于动态 `import()` 的 Rollup 分包，无需安装额外插件即可自动切片出独立的 chunk 文件。

### 3. 声明式权限判定 (`access.ts`) 与 403 路由阻断
在 `admin` 中构建 `access.ts`：
```typescript
export function getAccess(profile?: SysUserProfile | null) {
  const isSuperAdmin = profile?.userId === 1 || (profile?.roles || []).includes("ROLE_ADMIN");
  const permissions = new Set(profile?.permissions || []);
  return {
    canAccess: (accessCode?: string) => {
      if (!accessCode) return true;
      if (isSuperAdmin) return true;
      return permissions.has(accessCode);
    },
  };
}
```
在 `RouteRenderer` 渲染受保护节点时，若 `canAccess(route.access) === false`，直接渲染包含返回首页按钮的 Ant Design `<Result status="403" ... />` 组件，切断未授权直接输入 URL 越权的途径。

### 4. 消除双头硬编码与 ProLayout 菜单直通
`BasicLayout` 与 `PortalLayout` 均不再硬编码内部私有 `getDefaultRouteConfig`，而是直接引用 `config/routes.ts` 中经过权限过滤和国际化映射处理后的路由树作为 ProLayout 的 `route` 属性，保证导航栏与实际路由 100% 同源。

## Risks / Trade-offs

- **[Risk] 组件懒加载首次加载时的闪烁感知**
  → *Mitigation*: 设计与当前主题颜色一致的居中加载动画组件 `PageLoading`，并在 React 18 `startTransition` 或快速网络下几乎无感。
- **[Risk] 后端动态菜单下发的路径与静态路由的映射冲突**
  → *Mitigation*: 静态路由表作为可访问页面的权威注册表，后端动态菜单下发的 item 仅决定菜单层级的展示与排序，匹配不到已注册组件的路径按 404 处理，确保系统健壮性。
