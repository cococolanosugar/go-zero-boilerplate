# 实施任务清单：泰坦交付平台企业级 UI/UX 深度改造 (titan-enterprise-ux-matrix)

> **变更标识**：`titan-enterprise-ux-matrix`  
> **规划模式**：Spec-Driven  
> **核心目标**：全面重塑 Titan 交付平台的交互视觉与业务动线，彻底告别海外开源 Jenkins/GitHub 风格，打造高度对齐国内企业级交付标准的现代化研发生命周期工作台。

---

## 1. 契约与数据模型扩展 (Contract & Schema Extensions)

- [x] 1.1 扩展 Titan 数据持久层 DDL 与 Model
  - 在 `app/titan/model/` 中设计并新增 `titan_release_order`（发布单表）与 `titan_service`（微服务实体定义表）DDL
  - 生成 `titan_release_order_model.go` 与 `titan_service_model.go`
  - 验证：执行 `go build ./app/titan/model/...` 确保模型编译通过与 Session 事务支持

- [x] 1.2 扩展 Titan 微服务 RPC 契约与桩代码
  - 在 `app/titan/rpc/titan.proto` 中定义交付矩阵聚合接口 `GetDeliveryMatrix(MatrixReq) returns (MatrixResp)`
  - 定义发布单 CRUD 与状态流转接口（`CreateReleaseOrder`, `GetReleaseOrder`, `ListReleaseOrders`, `AuditReleaseOrder`）
  - 执行 `just gen-rpc titan` 生成服务端接口桩与 Client 代码
  - 验证：检查 `app/titan/rpc/pb/titan.pb.go` 与客户端接口定义完整性

- [x] 1.3 扩展统一网关 API 契约与前端 SDK
  - 在 `app/gateway/desc/titan.api` 中定义矩阵查询接口 `GET /api/v1/titan/matrix` 与发布单 RESTful 路由
  - 执行 `just gen-gateway` 生成网关 Handler 与 Logic 桩代码
  - 执行 `just gen-ts` 自动生成前端 `@zero/api` 强类型客户端定义
  - 验证：检查 `frontend/packages/api/` 中导出包含 `TitanGetDeliveryMatrix` 与相关 Types

---

## 2. 后端核心领域业务闭环 (Backend Domain Logic)

- [x] 2.1 实现交付矩阵聚合查询 Logic (`GetDeliveryMatrixLogic`)
  - 在 `app/titan/rpc/internal/logic/getdeliverymatrixlogic.go` 中聚合指定项目的环境列表、微服务列表与最近部署状态
  - 关联微服务在各环境下的当前运行版本（Git Tag / Commit / 镜像构建号）、部署时间与健康状态
  - 计算环境间版本差异与晋级就绪状态标记（`diffStatus`: `AHEAD`, `BEHIND`, `IN_SYNC`）
  - 验证：编写单元测试 `getdeliverymatrixlogic_test.go` 模拟多环境状态聚合与边界情况

- [x] 2.2 实现发布单状态机与 ITSM 审批卡点 Logic
  - 在 `app/titan/rpc/internal/logic/createreleaseorderlogic.go` 中实现封网窗口期校验（支持特定时段封板告警）
  - 集成 ITSM RPC 客户端：当发布环境为 `PROD` 生产环境时，自动调用 `ItsmRpc.StartProcess` 触发发布审批流程并关联流程实例 ID
  - 实现发布单审批回调与状态流转（`DRAFT` -> `PENDING_APPROVAL` -> `APPROVED` -> `EXECUTING` -> `SUCCESS`/`FAILED`）
  - 验证：编写单元测试校验窗口期拦截、ITSM 审批触发与状态机流转防护

- [x] 2.3 实现网关 BFF 聚合与透传 Logic
  - 在 `app/gateway/internal/logic/titan/` 中完成 `GetDeliveryMatrixLogic` 与 `ReleaseOrder` 系列网关路由透传
  - 结合 RBAC 中间件验证接口权限保护
  - 验证：网关编译测试 `go test ./app/gateway/internal/logic/titan/...`

---

## 3. 全景交付矩阵大盘与环境对比 (Matrix Grid & Cross-Env Promotion)

- [x] 3.1 研发交互式矩阵看板组件 (`DeliveryMatrixGrid`)
  - 在 `frontend/apps/titan/src/pages/matrix/` 构建二维网格组件（纵轴为微服务列表，横轴为环境序列：DEV -> TEST -> STAGING -> PROD）
  - 矩阵单元格展示部署状态、版本号 Tag、健康指示器，支持悬浮展示部署耗时与操作人
  - 验证：组件支持多服务多环境虚拟滚动与响应式自适应布局

- [x] 3.2 实现跨环境版本 Diff 对比抽屉 (`MatrixDiffDrawer`)
  - 点击单元格差异标记打开侧滑对比抽屉，呈现当前环境与目标环境的 Git Commits 增量列表与配置变更差异
  - 提供一键晋级动作（如将 TEST 经过验证的版本一键发起晋级 STAGING 或 PROD 部署）
  - 验证：对比抽屉平滑滑出，正确展示变更列表并集成快捷晋级触发器

---

## 4. 空间顶层架构与 Multi-Tabs 页签系统 (Workspace & Multi-Tabs)

- [x] 4.1 打造顶栏项目空间抽屉切换器 (`ProjectSwitcherDrawer`)
  - 在 `frontend/apps/titan/src/layouts/` 顶栏集成项目切换按钮，支持全局快捷键（如 `Ctrl+K` 或点击）唤起项目选择侧滑抽屉
  - 支持按项目名称、拼音、标识拼音首字母模糊筛选，提供“最近访问”与“收藏项目”分组
  - 切换项目后自动将当前上下文注入全局状态（`useProjectStore`）并持久化至 localStorage
  - 验证：切换项目时页面无缝响应，路由自动携带 `?project=xxx` 或更新项目级导航

- [x] 4.2 重塑项目内聚侧边栏导航 (Project-Scoped Sidebar)
  - 优化 Titan 侧边栏结构，收敛并聚焦项目内高频业务动线：
    - 交付大盘 (Matrix)
    - 流水线编排 (Pipelines)
    - 环境与集群 (Environments & Clusters)
    - 发布单协同 (Release Orders)
    - 质量与合规中心 (Quality & Compliance)
  - 验证：侧边栏严格符合 Ant Design ProLayout 规范与企业级视觉层次

- [x] 4.3 实现企业级 Multi-Tabs 浏览页签栏组件 (`WorkspaceTabs`)
  - 在布局主内容区顶部挂载标签页栏，支持多页面并行打开与快速切换
  - 提供右键快捷菜单：“刷新当前页”、“关闭其他”、“关闭右侧标签”、“全部关闭”
  - 支持 Tab 拖拽排序与状态记忆（保存表单与查询筛选条件）
  - 验证：页签切换无抖动，路由跳转与高亮同步准确

---

## 5. 紧凑表格与侧滑抽屉交互流 (High-Density & Drawer-First UX)

- [x] 5.1 全面优化表格紧凑度与微状态指示器 (Compact ProTable & Respirating Dots)
  - 统一流水线列表、发布单列表等表格行高至 36~40px（`size="small"`）
  - 采用呼吸微光状态圆点（`StatusBadge`）替代冗余大色块 Tag（绿色呼吸闪烁表示 RUNNING，绿色常亮表示 SUCCESS，红色表示 FAILED）
  - 常用操作（构建、部署、查看详情）外置为主操作区，次要操作收敛至“更多”下拉菜单
  - 验证：单屏可见数据量显著提升 50% 以上，视觉轻量呼吸无干扰

- [x] 5.2 实施 Drawer-First 全局交互流重构
  - 将流水线执行详情、发布日志、参数配置等二级操作全部从全屏跳转重构为 720px 右侧滑抽屉展示
  - 抽屉内无缝集成 ANSI 深色极客风终端组件（支持自动滚屏、搜索日志关键字与全屏切换）
  - 验证：用户在列表页点击即可在侧滑抽屉中实时查看构建日志，无需跳出当前页面丢失筛选上下文

---

## 6. 发布单生命周期与 ITSM 审批流集成 (Release Order & Compliance)

- [x] 6.1 开发发布单管理中心与新建向导 (`ReleaseOrderPage` & `CreateReleaseDrawer`)
  - 提供发布单列表筛选、变更内容概述、关联服务与目标环境展示
  - 新建发布单时自动校验封网窗口期，并在界面高亮提示
  - 验证：发布单表单项完备，支持选择微服务版本号与发布分支

- [x] 6.2 闭环生产发布审批卡点与流转联动
  - 当发布单目标环境为生产时，流水线自动进入暂停等待卡点（`AWAITING_APPROVAL`）
  - 展示关联 ITSM 流程单号、当前审批节点与审批人动态
  - 审批通过后自动触发流水线继续执行，审批驳回自动中断流水线并通知提交人
  - 验证：端到端验证前端发布单创建、ITSM 审批发起与状态实时同步展示

---

## 7. 前端样式合规与自动化验证 (Verification & Quality Gate)

- [x] 7.1 执行 Ant Design 6.x 样式与弃用语法检测
  - 运行 `just lint-antd` 与 `pnpm --filter @zero/titan lint`
  - 确保 0 警告、0 废弃 API（杜绝 `Card bordered`、旧版样式属性等）
  - 验证：严格遵从 `antd` MCP 知识库规范

- [x] 7.2 全量自动化测试与工程构建验证
  - 执行 Go 全量单元测试与编译：`go test ./app/titan/... ./app/gateway/...`
  - 执行前端单元测试套件：`pnpm test`
  - 执行前端工程全量类型检查与打包：`pnpm build`
  - 验证：所有微服务编译无报错，所有前端应用构建 100% 成功
