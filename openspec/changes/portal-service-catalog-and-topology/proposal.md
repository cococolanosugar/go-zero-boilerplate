## Why

当前技术门户（`apps/portal`）的微服务治理页面（`/services`）仅包含静态文字与折叠面板，无法直观反映全栈 Monorepo 体系下「统一网关 BFF ➔ 纯 gRPC 业务微服务 ➔ 基础设施与持久层」的三层调用依赖流向，亦缺乏微服务资产元数据、多协议端口矩阵、实时探针健康监控与沙箱调试直达能力。

为了将 Portal 建设为对齐 Spotify Backstage 与 CNCF 工业级标准的微服务开发者门户，亟需构建**「微服务软件服务目录与全景依赖拓扑治理中心 (Service Catalog & Architecture Topology Graph)」**，实现架构流向可视化、健康度秒级洞察与服务资产治理闭环。

## What Changes

- **交付交互式微服务分层拓扑图谱 (Architecture Topology & Dependency Graph)**：
  - 呈现清晰的三层调用依赖拓扑：
    - 接入层：技术门户（Portal :3000）与管理后台（Admin :3001）；
    - 网关层：统一对外 HTTP RESTful 网关 BFF（Gateway :8888，包含 JWT/RBAC/mr.Finish/pkg.result）；
    - 微服务层：User RPC (:8080)、Worker RPC (:8082)、ITSM RPC (:8084)、Titan RPC (:8086)；
    - 基础设施层：MySQL 8.0、Redis 7.0、Temporal (:7233/:8233)、Nacos (:8848)；
  - 动态标示通信协议与数据流（HTTP/RESTful、gRPC/Protobuf、MySQL/TCP、Redis/RESP、Temporal/gRPC）；
  - 支持节点点击联动：点击任一服务节点即高亮上下游调用链路（Upstream/Downstream），并在右侧/抽屉中展开该服务的完整运行画像。
- **微服务元数据资产卡片与抽屉详情 (Service Metadata & Ownership)**：
  - 提供工业级标准元数据：技术负责人/团队（Owner）、编程语言与框架、协议端口、责任边界（Domain Boundary）、Proto 契约源文件定位；
  - 提供「在 API Hub 中调试该服务」一键跳转按钮，无缝联动沙箱集市。
- **实时服务探针与健康监控 (Live Health & Registry Probes)**：
  - 提供各微服务连通性探针状态监测与 Nacos / Etcd 实例注册租约活跃状态指示器；
  - 支持一键刷新探测微服务健康状况。
- **基础设施与中间件全景资产库 (Infrastructure Components Catalog)**：
  - 集中展示持久层与分布式引擎配置（MySQL 强一致事务、Redis Cache-Aside、Temporal 分布式编排、Nacos 动态寻址）。

## Capabilities

### New Capabilities
- `portal-service-catalog`: 微服务软件服务目录与全景调用依赖拓扑治理中心，提供三层架构图可视化、上下游依赖高亮、微服务元数据卡片与探针健康状态监控。

### Modified Capabilities
<!-- No existing capability requirements are changing -->

## Impact

- **前端应用**：`frontend/apps/portal`
  - 升级页面：`frontend/apps/portal/src/pages/Services/index.tsx`
  - 新增组件：`frontend/apps/portal/src/pages/Services/components/`（`TopologyGraph.tsx`, `ServiceCard.tsx`, `ServiceDetailDrawer.tsx`, `InfraCatalog.tsx`, `catalogData.ts`, `probes.ts`）
  - 路由与多语言：保持现有一级入口 `/services`，在中英多语言字典中扩充服务目录与拓扑词条。
- **依赖库**：利用 React + Ant Design 6.x 与 SVG 交互渲染，0 额外重型第三方依赖侵入，保证与现有 AntD 主题完全自适应。
