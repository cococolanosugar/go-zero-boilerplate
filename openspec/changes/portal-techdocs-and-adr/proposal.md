## Why

当前全栈大仓在 `AGENTS.md` 与 `doc/design/` 中沉淀了深度的微服务架构原则、治理体系、异步编排引擎与 ADR 架构决策，但技术门户缺少系统化的在线文档中心，导致新开发者难以在 Web 页面中快速检索规范、阅读 Mermaid 流程图与理解历史设计决策。

为了对齐 Spotify TechDocs、Stripe Documentation 与 VitePress 的现代化文档体验，亟需在门户新增**「交互式技术文档与架构决策中心 (TechDocs & ADR Center)」**，打通文档知识库、Mermaid 图表渲染与架构大纲导航。

## What Changes

- **交付现代化三栏交互式技术文档中心 (`/docs`)**：
  - **左栏（280px）**：层级文档目录分类树，包含搜索过滤框、文档篇数徽标与分类折叠面板；
  - **中栏（自适应）**：结构化技术文档渲染引擎，支持代码块语法高亮、一键复制代码、Callout 警告提示框（`[!NOTE]`, `[!TIP]`, `[!WARNING]`）、Mermaid 流程拓扑图渲染与底部上一篇/下一篇翻页导航；
  - **右栏（220px）**：页内目录大纲索引（On This Page / TOC），支持页面滚动平滑联动高亮与锚点直达。
- **沉淀五大核心领域文档库与 ADR 决策专篇**：
  1. 🚀 **快速上手 (Getting Started)**：5 分钟本地开发环境拉起、大仓 Monorepo 目录结构解析、常用指令速查手册（`justfile` / `mise`）；
  2. 🏛️ **微服务架构规范 (Architecture Rules)**：统一网关 BFF 原则与并发聚合 (mr.Finish)、内部纯 gRPC 隔离守则、Context 绝对第一公民、持久层 Cache-Aside 强一致与 Session 事务；
  3. 🔐 **企业级治理体系 (Governance System)**：“一石二鸟”按钮-接口联动动态 RBAC 模型、零阻塞异步操作审计与登录审计、Casdoor SSO 统一身份认证；
  4. ⚡ **异步工作流与交付引擎 (Workflows & Delivery)**：基于 Temporal 的分布式异步编排与 Saga 事务系统、ITSM BPMN 2.0 工业级流程引擎、Titan 云原生流水线与 K8s Helm 幂等编排；
  5. 📜 **ADR 架构决策记录库 (Architecture Decision Records)**：收录 ADR-001 (统一网关BFF+内部gRPC)、ADR-002 (Temporal vs 消息队列)、ADR-003 (Casdoor 统一认证中心)。
- **全局导航与多语言路由接入**：
  - 在 `routes.ts` 与主布局菜单增加 `/docs` 一级入口；
  - 在中英繁多语言字典中扩充技术文档相关词条。

## Capabilities

### New Capabilities
- `portal-techdocs`: 交互式技术文档与架构决策中心，提供三栏式文档阅读器、层级目录索引、Mermaid 架构图可视化与 ADR 决策专篇。

### Modified Capabilities
<!-- No existing capability requirements are changing -->

## Impact

- **前端应用**：`frontend/apps/portal`
  - 新增页面：`frontend/apps/portal/src/pages/TechDocs/index.tsx`
  - 新增组件与文档库：`frontend/apps/portal/src/pages/TechDocs/components/`（`DocTree.tsx`, `DocViewer.tsx`, `DocToc.tsx`）及 `docsData.ts`
  - 路由与多语言：更新 `routes.ts` 与 `zh-CN.ts`、`en-US.ts`、`zh-TW.ts`
- **依赖库**：利用现有 Ant Design 6.x、ProCard 与高质感轻量代码渲染，0 额外重型第三方包侵入。
