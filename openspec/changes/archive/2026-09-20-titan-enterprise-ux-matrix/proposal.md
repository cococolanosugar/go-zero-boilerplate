# Titan 企业级本土化交付工作台与全景矩阵演进提案

## Why

Titan 当前界面采用扁平 SaaS 与轻量极客风格，存在空间感弱（项目仅作为右上角弱过滤项）、信息密度偏低（大卡片高留白）、多环境比对困难（各环境割裂在单 Tab 中无法横向对比）、交互中断感强（大量使用居中阻断式 Modal 弹窗）以及缺乏中国企业强监管下的“发布单与审批门禁”心智等痛点。不贴合中国国内中大型企业（互联网大厂、金融证券、科技中台）研发交付与 SRE 运维的实际工作习惯。

本提案旨在对标 Zadig、阿里云效、腾讯 CODING 与美团/字节内部交付中台的最佳实践，将 Titan 改造为**“项目内聚式空间、环境-微服务全景交付矩阵、高密度侧滑抽屉、沉浸式终端与联动 ITSM 发布单审批”**的现代化国内企业级研发交付平台。

## What Changes

1. **项目即空间（Project-Centric Workspace）导航与 Multi-Tabs 体系**：
   - 改造 `TitanLayout`：顶栏部署全局项目空间切换器（支持拼音检索、最近访问、星标），进入项目后左侧菜单自动收敛为该项目内的交付资产。
   - 引入 Multi-Tabs 多页签路由系统，支持研发在微服务定义、流水线执行历史、矩阵大盘之间多任务无缝穿梭，保留表单草稿与过滤状态。
2. **环境-微服务全景交付矩阵大盘（Environment-Service Matrix Grid）**：
   - 引入 Zadig 式二维交付看板：纵轴为项目微服务，横轴为环境（DEV / TEST / STAGING / PROD）。
   - 单元格直观展示运行镜像 Tag、Pod 实时就绪副本（如 `2/2` 呼吸灯）、发布人与耗时，支持横向版本 Diff 与一键晋级部署。
3. **高信息密度与侧滑抽屉流（Compact Table & Drawer First）**：
   - 表格默认行高收窄至 38px，单屏容纳 15+ 服务；检索栏支持 Ant Design Pro 经典的“展开/折叠高级筛选器”。
   - 服务定义编辑、配置查看、Pod 详情、部署参数全面由居中 Modal 重构为右侧滑出抽屉（Drawer, 720px），保持底重大盘上下文连续。
   - 升级日志查看器为开发者深色控制台终端（Dark ANSI Terminal），支持颜色高亮、实时 Follow 滚动、行号切换与日志下载。
4. **本土合规：发布单（Release Order）机制与 ITSM 流程引擎闭环**：
   - 建立发版计划与发布单管理，支持批量多微服务版本打包、封网窗口期校验。
   - 天然联动 Monorepo 内置的 `app/itsm` BPMN 2.0 流程引擎，生产发布自动派发审批单，审批通过后驱动自动化流水线。

## Capabilities

### New Capabilities

- `titan-delivery-matrix`: 环境-微服务二维交付全景矩阵看板规范——多环境横向对比、单元格微状态呼吸灯、Pod 副本健康度、跨环境一键晋级部署与镜像版本 Diff。
- `titan-project-workspace`: 项目空间内聚式导航与 Multi-Tabs 页签系统——顶栏全局空间快速检索抽屉、项目级专属二级功能菜单、多标签页缓存与路由守卫。
- `titan-dense-drawer-ux`: 高信息密度企业视图与侧滑抽屉交互规范——Compact 模式表格、折叠展开高级筛选器、Drawer-First 上下文不阻断交互、深色 ANSI 终端日志流。
- `titan-release-compliance`: 企业级版本发布单与 ITSM 审批流联动契约——发布单生命周期、发版窗口期封网控制、生产发布审批卡点、Titan 驱动流水线与 ITSM 状态机闭环。

### Modified Capabilities

- `titan-frontend-conformance`: 扩充国内企业级前端规范要求（抽屉优先取代居中弹窗、微状态呼吸灯与紧凑表格排版规范）。

## Impact

- **前端应用 (`@zero/titan`)**：
  - `TitanLayout.tsx`：顶栏与侧边栏结构重构，增加 Multi-Tabs 标签页容器；
  - `Environments/`：新增二维交付全景矩阵视图（Matrix View）组件；
  - `Apps/`、`Clusters/`、`Integrations/`：弹窗全量重构为侧滑 Drawer，表格启用 Compact Density；
  - 新增 `TerminalLogViewer` 沉浸式终端组件。
- **管理后台 (`apps/admin`)**：
  - 同步集成最新的 Matrix 全景大盘与 Drawer 交互规范。
- **后端网关与微服务 (`app/gateway`, `app/titan`)**：
  - `titan.api` 与 RPC 补充矩阵大盘聚合查询接口（一次性高效获取 Project 下所有 Env x App 的绑定与健康态矩阵，避免 N+1）；
  - 新增发布单数据模型与 ITSM 工单双向回调驱动。
