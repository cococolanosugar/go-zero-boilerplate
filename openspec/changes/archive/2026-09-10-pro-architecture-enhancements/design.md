## Context

当前项目已完成多端大仓（`admin` 与 `portal`）的基础架构对齐、契约生成和 Vitest 单元测试体系。详见 `proposal.md`。
现需落地高可用容灾防线、消息互动中枢、动态主题色体系与异步请求标准。

## Goals / Non-Goals

**Goals:**
- 在 `RouteRenderer.tsx` 中注入组件级 `ErrorBoundary`，隔离页面级渲染崩溃，保持导航栏与菜单可用。
- 在 `admin` 导航栏落地企业级 `NoticeIcon` 消息通知中心组件，内置“通知”、“消息”、“待办”三 Tab，支持未读 Badge 与一键清空已读。
- 扩展 `LayoutSettingsContext`，集成 `primaryColor` 与 8 款企业级预设主题色，动态响应于 Ant Design 6 `ConfigProvider`。
- 全栈工作区引入 `ahooks` 并确立 `useRequest` 作为非表格异步数据交互的推荐范式。

**Non-Goals:**
- 不构建后端的真实 WebSocket / SSE 实时推送集群（本次重点在前端交互协议、UI 状态与 Mock 数据闭环，预留服务端推送接口）。
- 不重写已有的 ProTable 表格请求逻辑（ProTable 继续复用现有的 `toProTableRequest`）。

## Decisions

### 1. 轻量化原生 Class ErrorBoundary 封装
- **选择**：编写高内聚的 `ErrorBoundary.tsx` 组件，实现 `getDerivedStateFromError` 与 `componentDidCatch`。
- **理由**：无需引入庞大的外部依赖，可无缝消费 Ant Design 6 的 `<Result status="error" />`，支持错误堆栈诊断、本地重置（Reset）与大盘回退。

### 2. NoticeIcon 数据协议模型
- **选择**：定义清晰的 `NoticeItem` 数据结构：
  ```ts
  export interface NoticeItem {
    id: string;
    title: string;
    datetime?: string;
    type: "notification" | "message" | "event";
    read?: boolean;
    avatar?: string;
    description?: string;
    extra?: string;
    status?: "default" | "processing" | "success" | "warning" | "error";
  }
  ```
- **理由**：对齐 Ant Design Pro 官方标准，天然支持分类过滤、未读计数统计与快捷清空。

### 3. 主题色动态 Token 注入
- **选择**：在 `LayoutSettingsContext` 中暴露 `primaryColor`，并提供 `PRESET_COLORS`（拂晓蓝 `#1677ff`、极客绿 `#52c41a`、酱紫 `#722ed1`、薄暮红 `#f5222d`、火山橙 `#fa541c` 等）。
- **理由**：Ant Design 6 原生支持通过 `ConfigProvider theme={{ token: { colorPrimary } }}` 实现毫秒级热换色，且可通过现有 `zero_admin_settings` 实现本地同步持久化。

### 4. 引入阿里标准 `ahooks`
- **选择**：在 `frontend` 根工作区安装 `ahooks`。
- **理由**：Ant Design Pro 原生推荐，全面标准化 `useRequest`（内置自动轮询、节流防抖、取消请求与生命周期钩子）。

## Risks / Trade-offs

- **[错误边界吞没开发环境警告]** → 缓解措施：在 `componentDidCatch` 中使用 `console.error` 输出完整堆栈，并提供可展开的错误堆栈查看卡片。
- **[动态主题刷新闪烁]** → 缓解措施：`LayoutSettingsContext` 在组件挂载前从 `localStorage` 同步初始化 `primaryColor`，确保首屏渲染无色差。
