## Context

技术门户当前 `/services` 页面仅提供静态文字与卡片，未直观展现全栈微服务的层级流向与资产元数据。详见 `proposal.md`。

## Goals / Non-Goals

**Goals:**
- 提供声明式三层（接入层 ➔ 网关 BFF ➔ gRPC 业务微服务 ➔ 基础设施）全景交互拓扑图谱；
- 支持节点交互：点击任一节点高亮上下游调用连线，并在抽屉中展开该微服务资产详情（技术栈、端口、责任人、Proto 源文件与业务边界）；
- 打通与 API Hub 的联动：在服务详情中提供「调试该服务接口」一键直达沙箱；
- 异步探测网关与微服务连通性（带 2 秒超时保护与平滑降级）；
- 集中展示持久层与中间件基础设施资产（MySQL 8.0、Redis 7.0、Temporal、Nacos）；
- 100% 遵循 Ant Design 6.x 设计规范与主题 Token，自适应暗黑模式与移动端屏幕。

**Non-Goals:**
- 不引入重型 Prometheus / Grafana 指标流处理（属于运维平台职责，本功能聚焦于软件资产目录与架构拓扑治理）；
- 不侵入修改后端微服务核心源码。

## Decisions

### 1. 采用轻量声明式 SVG + Ant Design Token 架构拓扑 vs 重型外部 Canvas 图引擎 (AntV G6 / React Flow)
- **决定**：自主构建基于 React SVG 与 Ant Design 6.x `theme.useToken()` 的声明式拓扑图组件 `TopologyGraph.tsx`。
- **考量与替代方案**：
  - 引入 AntV G6 或 React Flow 会增加 2MB+ 前端打包体积，且存在与 Ant Design 6 主题 Token 同步困难、暗黑模式切换样式闪烁等问题。
  - 基于 React + SVG 实现分层 DAG 拓扑图，打包体积零增加，启动渲染耗时 < 5ms，连线贝塞尔曲线（Cubic Bézier）流畅美观，且与 Ant Design 卡片、标签、抽屉完全天然统一。

### 2. 软件目录资产模型解耦 (`catalogData.ts`)
- **决定**：在 `frontend/apps/portal/src/pages/Services/components/catalogData.ts` 抽象强类型 `ServiceItemVO`、`InfraItemVO` 与 `DependencyEdgeVO`。
- **内容覆盖**：
  - 网关服务：`gateway` (HTTP 8888, BFF 流量入口)；
  - 业务微服务：`user-rpc` (:8080), `worker-rpc` (:8082), `itsm-rpc` (:8084), `titan-rpc` (:8086)；
  - 基础设施：`mysql` (:3306), `redis` (:6379), `temporal` (:7233/:8233), `nacos` (:8848)；
  - 依赖边集：清晰刻画客户端 ➔ 网关 ➔ 微服务 ➔ 基础设施的 10 条调用链路。

### 3. 非阻塞式实时探针机制 (`probes.ts`)
- **决定**：探针检测采用异步并发执行，带有 2000ms 超时熔断保护。探测网关与后台服务时，即使本地服务未全部拉起，界面依然优雅降级展示离线/在线状态灯，绝不引发组件渲染异常。

## Risks / Trade-offs

- **[本地服务未完全拉起]** ➔ 探针捕获网络拒绝或超时异常，平滑回退为“未连接”微标，提示开发者一键刷新，不影响目录正常查阅。
- **[移动端小屏展示]** ➔ SVG 拓扑图支持水平滚动容器包裹或在小屏下折叠为分层卡片流，保障全尺寸屏幕体验。
