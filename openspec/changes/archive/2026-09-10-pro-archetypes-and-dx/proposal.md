## Why

Align the fullstack monorepo with the complete enterprise feature set of Ant Design Pro and modern API developer experience (DX). While routing, layout tokens, and basic CRUD tables are established, the system still lacks: (1) First-screen bootstrap `<PageLoading />` protection against flash-of-unauthenticated content, (2) User-configurable watermark and compact layout algorithms in `SettingDrawer`, (3) Standard enterprise page archetypes (Workplace, StepsForm, Advanced Profile, Success Result), (4) ProTable batch operations with alert bar and data export, (5) Global `Ctrl+K` Command Palette (Spotlight), (6) Gateway-backed real-time SSE notifications, and (7) OpenAPI/Swagger documentation generation and developer entrypoints.

## What Changes

- **P0 体验与稳定性 (Stability & Tokens)**:
  - 在 `BasicLayout` 与 `PortalLayout` 中接入 `initialState.loading` 首屏骨架屏保护，渲染 `<PageLoading />` 杜绝路由与菜单闪烁。
  - 扩展 `LayoutSettingsContext`，支持 `watermark`（安全水印动态开关）与 `compact`（紧凑算法模式 `theme.compactAlgorithm`）及 LocalStorage 持久化。
- **P1 生产力范式与数据治理 (Page Archetypes & ProTable Power)**:
  - 落地 **Workplace (工作台)** (`/workplace`)：员工名片问候语、团队统计指标、进行中项目卡片、动态流与快捷导航。
  - 落地 **StepsForm (分步向导表单)** (`/form/step-form`)：转账向导三步流转（基础信息、确认转账与结果凭证）。
  - 落地 **Advanced Profile (高级详情页)** (`/profile/advanced`)：流转状态 Steps、`ProDescriptions` 概览、明细子表与审批时间线。
  - 落地 **Success Result (业务成功结果页)** (`/result/success`)：标准操作结果卡片与后续动作引导。
  - 升级 `Orders` / `Users` 表格，启用 `rowSelection` 批量操作警示栏 (`tableAlertRender` / `tableAlertOptionRender`) 与 CSV 快捷数据导出。
- **P2 极客交互与长链接 (Command Palette & Real-Time SSE)**:
  - 研发全局快捷键 `Ctrl+K` / `Cmd+K` 命令面板 (Spotlight Command Palette)，支持模糊检索全量菜单、快捷动作与主题切换。
  - 网关提供 `/api/v1/system/notice/stream` SSE 实时流接口，前端 `NoticeIcon` 建立 EventSource 监听，支持实时订单与系统事件推送。
- **OpenAPI 接口文档与开发体验 (DX)**:
  - 在 `justfile` 增加 `just gen-swagger`，通过 `goctl api swagger` 从网关 IDL 自动生成规范化 OpenAPI/Swagger JSON 契约。
  - 在管理后台顶部工具栏和系统导航挂载「API 文档」直达入口，提供在线接口浏览与调试体验。

## Capabilities

### New Capabilities
- `frontend-pro-archetypes-and-dx`: Comprehensive enterprise Ant Design Pro archetypes (Workplace, StepsForm, Advanced Profile, Result), PageLoading bootstrapping guard, watermark/compact drawer controls, ProTable batch alert & export, Ctrl+K spotlight command palette, gateway SSE notification streaming, and OpenAPI documentation integration.

### Modified Capabilities
<!-- No requirement changes to existing capabilities -->

## Impact

- **Gateway BFF (`app/gateway`)**: 新增 SSE 实时通知路由 `/api/v1/system/notice/stream`，生成并承载 OpenAPI/Swagger 契约输出。
- **Admin & Portal (`frontend/apps/admin`, `frontend/apps/portal`)**:
  - 布局与上下文：`Root.tsx`（compact algorithm 注入）、`LayoutSettingsContext`（watermark & compact 开关）、`BasicLayout`（`<PageLoading />` 首屏拦截）。
  - 页面与路由：新增 `/workplace`、`/form/step-form`、`/profile/advanced`、`/result/success`。
  - 组件与交互：新增 `CommandPalette` (`Ctrl+K`)，增强 `NoticeIcon`（SSE 订阅），升级 ProTable（批量操作条与数据导出），顶部挂载「API 接口文档」入口。
- **研发运维脚本 (`justfile`, `Makefile`)**: 增加 `just gen-swagger` 指令。
