## Why

虽然 `admin` 与 `portal` 已经在目录结构、IDL 契约驱动、多端 Monorepo 与测试体系上对齐了 Ant Design Pro 的核心规范，但在生产级**交互中枢、局部容灾防线、高级表单与异步逻辑层**仍存在关键空白：缺少页面级错误边界（易致白屏崩溃）、缺少站内信与待办中枢（`NoticeIcon`）、缺少动态主题调色板（`SettingDrawer` 多色支持）、非表格请求缺乏统一的状态与防抖抽象（`ahooks` / `useRequest`）。
全面落地这些标杆实践，将使本项目的前端工程成熟度、容灾健壮性与研发效能跃升至企业生产级水准。

## What Changes

- **页面级 ErrorBoundary 错误边界**：在路由渲染层（`RouteRenderer.tsx`）与布局层挂载错误边界，当页面抛出未捕获异常时局部降级渲染 Result 友好卡片，提供重试与返回大盘按钮，避免全站白屏。
- **企业级 NoticeIcon 消息与通知中心**：在 `admin` 导航栏集成 Popover 消息中心，提供“通知 (Notifications)”、“消息 (Messages)”、“待办 (Todos)”三 Tab 分类，支持未读 Badge 标记、一键已读与清空。
- **SettingDrawer 多色板 Token 联动**：在 `LayoutSettingsContext` 增加 `primaryColor`，支持拂晓蓝、极客绿、酱紫、薄暮红、火山橙等 8 色动态切换，并与 Ant Design 6 的 `<ConfigProvider theme={{ token: { colorPrimary } }}>` 实时绑定。
- **全站推行 ahooks (`useRequest`)**：在工作区引入 `ahooks`，统一非表格页面的异步请求、loading 态、防抖节流与轮询机制。
- **全站 PageContainer 与面包屑自动映射规范化**：标准化所有顶层页面的骨架容器，实现路由层级到 Breadcrumb 的自动化推导。

## Capabilities

### New Capabilities
- `frontend-pro-enhancements`: 提供页面级 React ErrorBoundary 容灾组件、Header NoticeIcon 站内信与待办中心、SettingDrawer 动态多色板 Design Token 注入，以及基于 ahooks useRequest 的异步状态管理抽象。

### Modified Capabilities

## Impact

- **Affected Code**:
  - `frontend/apps/admin/src/router/RouteRenderer.tsx`
  - `frontend/apps/portal/src/router/RouteRenderer.tsx`
  - `frontend/apps/admin/src/components/RightContent/` (新增 `NoticeIcon/`)
  - `frontend/apps/admin/src/contexts/LayoutSettingsContext.tsx`
  - `frontend/apps/admin/src/layouts/BasicLayout.tsx`
  - `frontend/apps/admin/src/Root.tsx` & `frontend/apps/portal/src/Root.tsx`
  - `frontend/package.json` (引入 `ahooks`)
- **APIs & Dependencies**:
  - 新增 `ahooks` 依赖
  - 0 破坏性变更（完全向后兼容现有的 `@zero/api` 与路由配置）
