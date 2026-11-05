## 1. 软件目录资产数据模型与探针引擎 (Catalog Models & Probing Engine)

- [x] 1.1 在 `frontend/apps/portal/src/pages/Services/components/catalogData.ts` 定义全套微服务资产强类型（`ServiceItemVO`, `InfraItemVO`, `DependencyEdgeVO`）与完整服务拓扑元数据字典（覆盖 Gateway, User, Worker, ITSM, Titan, MySQL, Redis, Temporal, Nacos）
- [x] 1.2 在 `frontend/apps/portal/src/pages/Services/components/probes.ts` 实现非阻塞健康探测通道，支持快速检测网关与微服务端口可达性，带 2 秒超时降级保护

## 2. 交互式架构拓扑图谱与资产卡片组件 (Interactive Topology & Asset Cards)

- [x] 2.1 在 `frontend/apps/portal/src/pages/Services/components/TopologyGraph.tsx` 实现声明式 SVG 三层架构拓扑流向图，渲染接入层、网关层、微服务层与基础设施层，支持节点悬浮高亮、点击联动与贝塞尔连线渲染
- [x] 2.2 在 `frontend/apps/portal/src/pages/Services/components/ServiceDetailDrawer.tsx` 实现微服务元数据抽屉，展示技术规格、责任人团队、Proto 文件位置并提供一键跳转 API Hub 调试按钮
- [x] 2.3 在 `frontend/apps/portal/src/pages/Services/components/InfraCatalog.tsx` 实现基础设施与持久层资产卡片组件，直观展示 MySQL、Redis、Temporal、Nacos 运行角色与技术特性

## 3. 服务目录页面重构与质量门禁 (Page Integration & Quality Gate)

- [x] 3.1 在 `frontend/apps/portal/src/pages/Services/index.tsx` 组装服务目录总览：集成状态指标条、拓扑图谱、微服务资产矩阵与基础设施卡片
- [x] 3.2 在 `frontend/apps/portal/tests/serviceCatalog.test.ts` 编写自动化单元测试，覆盖拓扑数据完整性、探针探测逻辑与上下游关系计算
- [x] 3.3 执行 Ant Design 6.x Lint 静态扫描与生产构建验证：运行 `npx antd lint ./frontend/apps/portal/src` 与 `pnpm --filter @zero/portal build` 确保 100% 通过
