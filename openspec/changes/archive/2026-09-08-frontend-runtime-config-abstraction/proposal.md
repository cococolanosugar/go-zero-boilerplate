## Why

在前期优化中，前端已实现 Ant Design Pro 的“编译时声明式路由配置（`config/routes.ts`）”与“声明式权限判定引擎（`access.ts`）”。然而，运行时体系仍然存在显著的职责耦合与架构痛点：
1. **视图与运行时业务配置严重混杂**：[BasicLayout.tsx](file:///D:/work/go-zero-boilerplate/frontend/apps/admin/src/layouts/BasicLayout.tsx) 与 [PortalLayout.tsx](file:///D:/work/go-zero-boilerplate/frontend/apps/portal/src/layouts/PortalLayout.tsx) 中充斥着大量的业务配置代码（用户头像下拉、退出登录、主题切换、全屏切换、文档与外链、水印计算、全局设置抽屉等，代码量达 300+ 行），未能实现配置与视图骨架的彻底分离；
2. **初始化时序滞后且无统一抽象**：用户登录画像与权限数据是在 `BasicLayout` 挂载后的 `useEffect` 中被动拉取的，缺少类似 Ant Design Pro `getInitialState()` 的前置全局初始化状态生命周期与统一上下文。

通过引入标准化的 **运行时配置文件 (`src/app.tsx`)** 与全局 `InitialStateProvider`，将 `getInitialState()` 与 `layout()` 运行时配置从布局组件中彻底解耦，使布局组件纯粹化为无状态骨架，全面对齐 Ant Design Pro 官方工程规范。

## What Changes

- **建立标准运行时配置文件规范 (`src/app.tsx`)**：
  - 在 `admin` 和 `portal` 中分别创建 `src/app.tsx` 运行时配置文件。
  - 导出 `getInitialState()` 异步初始化函数，在应用挂载与鉴权拦截时统一管理用户画像、角色字典、权限集合与动态菜单树。
  - 导出 `layout()` 运行时配置函数，统一定义 ProLayout 的 `title`、`logo`、`waterMarkProps`、`avatarProps`、`actionsRender`、`footerRender` 等所有业务交互插槽。
- **全局运行时初始状态管理 (`InitialStateProvider` / `useInitialState`)**：
  - 封装轻量级的运行时全局状态容器，提供 `initialState` 读取与 `setInitialState` 动态刷新能力（对齐 Ant Design Pro `useModel('@@initialState')`）。
- **极简化重构布局组件 (`BasicLayout.tsx` & `PortalLayout.tsx`)**：
  - 将原先写死在 `BasicLayout` 和 `PortalLayout` 中的数百行业务配置代码全部抽离至 `app.tsx`。
  - 布局组件彻底瘦身为纯粹的 UI 视图骨架（`<ProLayout {...runtimeLayoutConfig}><Outlet /></ProLayout>`），代码量减少 70% 以上。

## Capabilities

### New Capabilities
- `frontend-runtime-config`: 建立标准化前端运行时配置规范（`src/app.tsx`），提供全局前置 `getInitialState()` 初始状态管理、声明式 `layout()` 运行时配置函数，实现应用业务插槽与布局容器的彻底解耦。

### Modified Capabilities
<!-- 无已有 spec 的行为变更 -->

## Impact

- **Affected Applications**:
  - `frontend/apps/admin`: 新增 `src/app.tsx`、`src/contexts/InitialStateContext.tsx`，重构 `src/App.tsx` 与 `src/layouts/BasicLayout.tsx`。
  - `frontend/apps/portal`: 新增 `src/app.tsx`、`src/contexts/InitialStateContext.tsx`，重构 `src/App.tsx` 与 `src/layouts/PortalLayout.tsx`。
- **Dependencies**: 纯原生 React + Ant Design / ProComponents，0 额外三方依赖。
- **Breaking Changes**: 无外部 API 破坏性变更，现有页面 URL 与功能交互 100% 兼容。
