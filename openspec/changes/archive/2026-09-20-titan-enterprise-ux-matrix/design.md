# Titan 企业级本土化交付工作台与全景矩阵设计方案

## Context

Titan 前端系统基于 React 18 + Vite + Ant Design 6 构建，后端由 `app/gateway` 与纯 gRPC 微服务 `app/titan` 承载。目前系统已完成安全加固与基础能力打通，但在日常研发交付场景中，缺少空间内聚感与横向环境比对能力。详见 [proposal.md](proposal.md)。

## Goals / Non-Goals

**Goals:**
- 实现 Zadig 风格的“环境-微服务”二维交付全景矩阵（Matrix View），单次批量请求获取全网格数据，杜绝 N+1；
- 改造 `TitanLayout` 实现“项目空间内聚（Project-Centric）”菜单与 Multi-Tabs 标签页；
- 建立 Drawer-First 交互体系，抽屉式承载服务配置、部署流水线与 Pod 状态；
- 实现深色 ANSI 终端控制台组件，支撑实时日志跟随与高亮搜索；
- 设计并对接轻量“发布单（Release Order）”数据模型，与内置 `app/itsm` BPMN 流程引擎实现生产发版审批拦截。

**Non-Goals:**
- 不重写底层 Kubernetes 与 Jenkins 核心执行引擎（沿用既有 Client 与 Template 体系）；
- 不做第三方商业化 PaaS 计费与多租户配额限制；
- 外部审批系统（如飞书/钉钉原生审批流）不在本阶段直连，优先打通 Monorepo 内置 ITSM 审批流。

## Decisions

### 1. 交付矩阵全景数据聚合（一次性批量返回 vs 前端散装并发）
- **决定**：在 Titan RPC 与网关层新增 `GetDeliveryMatrix` 接口，后端在单次请求内通过 `GROUP BY` 与 `WHERE env_id IN (...)` 批量组装二维数据网格 `{ apps: [], envs: [], matrix: { [appId]: { [envId]: BindingItem } } }`。
- **理由**：若由前端并发逐个请求环境活体数据，在 20 个服务 x 5 个环境时会瞬发 100 次 HTTP 请求，引发浏览器并发限制与后端连接池压力。
- **替代方案**：前端 `Promise.all` 逐格请求（已否决，开销大且无事务一致性）。

### 2. 空间导航模式：项目内聚与顶栏切换器
- **决定**：将空间切换提升至全局 TopBar，以 Popover 浮层/抽屉承载项目拼音检索、最近访问与星标；左侧侧边栏只展示当前选定项目的交付生命周期（全景、组件、环境、构建、发布单）。
- **理由**：符合阿里云效、CODING、GitLab 等国内企业级中台的标准心智，减少跨层级跳转时的认知负担。

### 3. Drawer-First 交互与高密度设计规范
- **决定**：
  - 新建/编辑微服务、配置查看、Pod 实例详情统一使用 720px 右侧滑出抽屉；
  - 表格全面采用 Ant Design `size="small"`，行高限制在 38px；
  - 状态指示全面采用微尺寸 Badge 呼吸灯（动态 CSS pulse）。
- **理由**：研发人员在大盘中排障时，需要保持左侧背景大盘的上下文不丢失，抽屉在宽屏（1080p/2K）下具有极佳的视觉连续性。

### 4. 沉浸式终端日志组件（轻量 DOM 终端 vs Heavy xterm.js）
- **决定**：优先封装专用的 `DarkTerminalViewer` React 组件（背景色 `#141414`，ANSI 颜色解析、虚拟滚动、时间戳开关、自动跟随与日志导出）。
- **理由**：轻量级且无复杂 Canvas 依赖，对只读日志流具有毫秒级渲染性能与完备的 React 上下文兼容性。

### 5. 发布单与 ITSM 流程引擎联动
- **决定**：
  - 新增 `titan_release_order` 表，记录发版批次、微服务与制品列表、封网时间与状态；
  - 发布环境为 PROD 时，自动调用 `app/itsm` RPC 发起发版审批流程，审批完成由 ITSM 回调触发 Titan 执行。
- **理由**：复用 Monorepo 内已有的工业级 BPMN 2.0 ITSM 引擎，形成端到端交付与合规治理闭环。

## Risks / Trade-offs

- **[Risk] 全景矩阵在超大项目（100+ 服务）下的渲染性能**  
  → Mitigation: 矩阵大盘集成虚拟滚动（Virtual List），仅渲染可视区域微服务行；支持按服务名称拼音即时前端快筛。
- **[Risk] Multi-Tabs 多页签可能导致内存占用膨胀**  
  → Mitigation: 限制最大开启页签数为 10 个，超出自动 LRU 淘汰最早非活动标签；销毁隐藏页签中占用显存的大型图表实例。
- **[Risk] 生产发布与 ITSM 审批流回调的可靠性**  
  → Mitigation: 采用幂等单号绑定（`orderNo` 即业务 Key），支持 ITSM 审批通过后的主动轮询补偿机制，防止回调通知丢失。
