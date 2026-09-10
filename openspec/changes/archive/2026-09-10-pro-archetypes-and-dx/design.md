## Context

The repository is a fullstack monorepo featuring a Go-Zero HTTP gateway (`app/gateway`), gRPC microservices, and React 18 + Vite frontend applications (`apps/admin` and `apps/portal`) using Ant Design 6.6.2 and ProComponents 2.8.10.

While foundational features (JWT, RBAC dynamic routes, ErrorBoundary, NoticeIcon, LayoutSettings) are complete, modern enterprise standards require complete page archetypes, flash-free bootstrap loading, high-density compact mode, keyboard-driven navigation (`Ctrl+K`), server-sent event notifications, and first-class OpenAPI developer exploration.

## Goals / Non-Goals

**Goals:**
- **P0 体验与稳定性**:
  - 在 `BasicLayout` 与 `PortalLayout` 中接入 `initialState.loading` 拦截，呈现 Pro 官方 `<PageLoading />`，根除首屏空白和菜单重绘闪烁。
  - 在 `LayoutSettingsContext` 增加 `watermark`（安全水印）与 `compact`（紧凑算法）开关，并在 `Root.tsx` `<ConfigProvider>` 复合注入 `theme.compactAlgorithm`。
- **P1 经典页面范式与 ProTable 高级数据治理**:
  - 落地四大标志性业务模板：
    1. `/workplace` (工作台)：问候名片 Banner、团队关键指标、`ProCard` 项目卡片网格、动态流。
    2. `/form/step-form` (分步向导表单)：三步式向导（转账信息 $\rightarrow$ 确认信息 $\rightarrow$ 完成反馈）。
    3. `/profile/advanced` (高级详情页)：流程 Steps 状态、`ProDescriptions`、关联嵌套 `ProTable`、审批日志时间轴。
    4. `/result/success` (业务结果反馈页)：标准结构化成功卡片与后续动作引导。
  - 在 `Orders` 订单管理和 `Users` 表格开启 `rowSelection` 结合 `tableAlertRender` & `tableAlertOptionRender` 批量删除/导出操作，并新增 CSV 导出。
- **P2 极客交互与长链接**:
  - 全局集成 `Ctrl+K` / `Cmd+K` Spotlight Command Palette（命令面板），支持模糊检索菜单与全局动作。
  - 网关提供 `/api/v1/system/notice/stream` SSE 实时流，前端 `NoticeIcon` 挂载 EventSource 监听实时通知。
- **OpenAPI 接口文档 (DX)**:
  - 增加 `just gen-swagger`，调用 `goctl api swagger` 自动从网关 IDL 导出 `gateway.json`。
  - 前端顶部工具栏挂载「API 文档」直达入口，并支持内置/外链式 Swagger UI 预览。

**Non-Goals:**
- 不重构现有 gRPC 业务微服务的数据库实体。
- 不引入重型的第三方无样式命令行库，优先复用 Ant Design 6 原生语义化组件保证设计 Token 继承与体积轻量化。

## Decisions

### 1. 首屏启动拦截与 PageLoading 守卫
- **方案**：在 `BasicLayout.tsx` 与 `PortalLayout.tsx` 顶部检查 `if (initialState.loading) return <PageLoading />;`。
- **理由**：避免在未拿到 `currentUser` 和 `menus` 之前向子组件传递空状态，避免子组件误触 403 重定向或菜单栏折叠展开的视觉抖动。

### 2. Ant Design 6 算法复合 (Theme Algorithm Composition)
- **方案**：在 `Root.tsx` 中使用算法数组形式组合暗黑与紧凑模式：
  ```tsx
  const algorithms = [
    isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    ...(settings.compact ? [theme.compactAlgorithm] : []),
  ];
  ```
- **理由**：Ant Design 6 官方原生支持算法链式组合，无需任何自定义 CSS 覆盖即可无缝降低表格、表单和卡片的内边距，实现紧凑高密度排版。

### 3. 全局 Spotlight Command Palette (`Ctrl+K`)
- **方案**：实现 `CommandPalette.tsx` 组件，监听全局 `keydown`（检测 `(e.metaKey || e.ctrlKey) && e.key === 'k'`）。打开时展示浮层搜索框，基于当前用户有权限的菜单列表和系统动作（切换暗黑、切换色板、退出登录）执行即时模糊匹配，回车即可跳转或执行。

### 4. 网关 SSE 实时通知流 (Server-Sent Events)
- **方案**：在 `app/gateway` 注册原生 HTTP 处理函数 `/api/v1/system/notice/stream`，设置 `Content-Type: text/event-stream`、`Cache-Control: no-cache`、`Connection: keep-alive`。定时或基于通道推送 JSON 事件包。前端 `NoticeIcon` 启动 `new EventSource()`，当接收到消息时自动更新 Badge 未读数与列表。

### 5. OpenAPI 规范生成与直达体验
- **方案**：
  1. 在 `justfile` 增加 `gen-swagger: goctl api swagger -api app/gateway/desc/gateway.api -dir manifest/swagger -filename gateway`。
  2. 脚本同时将最新 swagger 复制到 `frontend/apps/admin/public/openapi.json`。
  3. 在管理端顶部工具栏 `RightContentActions` 添加 `ApiOutlined` 图标按钮，点击即可查看 OpenAPI 规范或直接跳转 API 调试页面。

## Risks / Trade-offs

- **[Risk]** 浏览器长连接 SSE 可能在网络切换时中断。
  $\rightarrow$ **Mitigation**：浏览器原生 `EventSource` 会在断开后自动重试重连；前端静默捕获 `onerror`，不产生干扰性 Toast 提示。
- **[Risk]** 紧凑算法在某些大屏幕上可能字体较小。
  $\rightarrow$ **Mitigation**：在 `SettingDrawer` 中默认保持标准模式，由用户自主开启并持久化到本地存储。
