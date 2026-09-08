## Why

为了让中后台具备成熟商业级 Ant Design Pro 产品的视觉质感与多任务处理能力，需要消除当前系统在路由输入错误时“直接粗暴重定向到仪表盘”的糟糕体验，抹平跨平台浏览器原生宽粗灰色滚动条，并提供国内企业级中后台极高频依赖的“多标签页（Multi-Tabs）”多任务并行业务浏览能力。

## What Changes

- **1. 基础质感与异常矩阵 (Foundations & Exceptions)**：
  - 新增 `frontend/apps/admin/src/pages/Exception/404.tsx`（资源未找到页，集成 Pro Result 与返回首页引导）。
  - 新增 `frontend/apps/admin/src/pages/Exception/500.tsx`（服务器内部错误页，支持重新加载）。
  - 重构 `frontend/apps/admin/src/config/routes.ts`：将通配符路由 `*` 明确导向 404 异常页，并挂载 `/500` 路由。
  - 新增 `frontend/apps/admin/src/global.css` 并在 `src/main.tsx` 中导入：实现 6px 优雅圆角细滚动条（自适应深浅色模式）、平滑滚动、文本高亮配色与容器高度兜底。
  - 新增 `frontend/apps/admin/src/constants/index.ts`：统一收敛前端应用层 Storage Keys、默认分页、Tab 状态键名等私有常量。
- **2. 可配置多标签页导航系统 (Multi-Tabs Layout)**：
  - 在 `src/config/defaultSettings.ts` 中增加 `tabsLayout: boolean`（默认为 `true`），并打通 `BasicLayout` 的 `SettingDrawer` 支持动态热切换。
  - 创建 `frontend/apps/admin/src/components/MultiTabs/index.tsx`：自动监听路由变化记录已访问 Tab，支持点击切换、关闭当前、关闭其他、关闭全部及刷新路由。
  - 在 `frontend/apps/admin/src/layouts/BasicLayout.tsx` 的 `<Outlet />` 内容区上方优雅嵌入多标签页。

## Capabilities

### New Capabilities
- `frontend-pro-tabs-and-foundations`: 涵盖 404/500 异常页矩阵、全局细滚动条样式体系、前端应用专属常量收敛以及可配置多标签页 (Multi-Tabs) 导航交互。

### Modified Capabilities
<!-- No requirement changes to existing specs -->

## Impact

- **修改代码**：
  - `frontend/apps/admin/src/main.tsx`（导入 `global.css`）
  - `frontend/apps/admin/src/config/routes.ts`（补充 404 与 500 路由映射）
  - `frontend/apps/admin/src/config/defaultSettings.ts`（增加 `tabsLayout` 配置）
  - `frontend/apps/admin/src/layouts/BasicLayout.tsx`（挂载 `MultiTabs` 组件）
- **新增模块**：
  - `frontend/apps/admin/src/global.css`
  - `frontend/apps/admin/src/constants/index.ts`
  - `frontend/apps/admin/src/pages/Exception/404.tsx`
  - `frontend/apps/admin/src/pages/Exception/500.tsx`
  - `frontend/apps/admin/src/components/MultiTabs/index.tsx`
- **依赖说明**：零新增外部 npm 依赖，完全依托 Ant Design 6.x 与 ProComponents。
