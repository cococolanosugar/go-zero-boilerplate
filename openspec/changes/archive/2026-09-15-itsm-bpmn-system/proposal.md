## Why

企业级数字化运营和运维治理迫切需要标准化的 IT 服务管理 (ITSM) 闭环体系（覆盖服务目录、事件、问题、变更与配置治理）。本项目基于全栈 Monorepo 架构（go-zero + Ant Design ProComponents），亟需一套集“图形化 BPMN 流程编排、高可配置动态表单、SLA 服务时效治理、敏捷工单流转与全景跟踪审计”于一体的现代化 ITSM 架构设计方案，为企业 IT 运维与日常服务流程提供开箱即用、高扩展性的核心支柱。

## What Changes

本变更输出一套基于 **Ant Design ProComponents** 与 **bpmn-js** 的现代化 ITSM 系统的完整系统设计规范与实施方案：

- **BPMN 2.0 流程建模与跟踪体系 (bpmn-js Integration)**：
  - 基于 `bpmn-js/lib/Modeler` 构建可拖拽流程建模器，封装与 Ant Design 6.x 主题融合的自定义属性配置面板（ExtensionElements），支持审批节点、多候选人/组规则、会签/或签、分支网关表达式与超时处理。
  - 基于 `bpmn-js/lib/Viewer` 构建可视化流程追踪器，实现工单流转历史的高亮染色（已通过、当前办理、回退/驳回节点）、节点处理意见悬浮卡片及耗时展示。
- **动态工单表单与字段级权限矩阵 (Dynamic ProForm Engine)**：
  - 基于 `@ant-design/pro-components` 的 `BetaSchemaForm` 打造服务目录动态表单渲染引擎，支持文本、下拉、级联、人员部门选择器、附件及表格等丰富控件。
  - 设计“流程节点-表单字段”权限控制矩阵（只读、可编辑、必填、隐藏），实现申请人填写与各审批/处理节点按需受控维护。
- **ITSM 业务工单工作台 (ProTable Ticket Hub)**：
  - 基于 `ProTable` + `PageContainer` 打造多维工单视图（我的待办、我的已办、我发起的、部门工单、预警工单）。
  - 提供工单详情页（左侧动态表单/工单时间轴，右侧 BPMN 运行流转轨迹，底部流转操作抽屉：通过/驳回/转派/加签/废弃）。
- **后端流程引擎架构与微服务设计 (go-zero ITSM Service)**：
  - 规划独立 `app/itsm` 微服务（或结合 `app/worker` Temporal 编排引擎），设计流程定义、流程实例、节点任务（Task）、工单数据（EAV/JSONB）及审计日志等核心数据模型。
  - 评估 BPMN 2.0 XML 解析执行 vs 轻量状态机 vs Temporal 工作流映射的落地架构，确保分布式环境下的事务一致性与高吞吐。
- **SLA 服务时效预警与多渠道通知联动**：
  - 设计工单优先级（P1~P4）关联的响应 SLA（Response SLA）与解决 SLA（Resolve SLA）时钟状态机，支持工作日日历排除、工单挂起暂停。
  - 与现有通知体系联动，实现待办提醒、SLA 黄色预警与超时升级推送。

## Capabilities

### New Capabilities
- `itsm-system`: 覆盖基于 Ant Design ProComponents 与 bpmn-js 的 ITSM 流程设计、动态表单引擎、工单工作台、后端模型与流程执行、SLA 监控及组织权限联动的完整架构与全生命周期能力。

### Modified Capabilities
*(无已发布规范的破坏性变更，本功能为全新能力引入)*

## Impact

- **前端影响**：
  - 引入 npm 依赖：`bpmn-js`、`diagram-js` 及相关 XML 解析辅助库。
  - `apps/admin` 新增 ITSM 管理视图与设计器画布组件、工单中心及 SLA 规则配置路由。
  - `@zero/api` / 网关 SDK 将新增 ITSM 相关服务接口契约。
- **后端影响**：
  - 网关 `app/gateway` 新增 ITSM 相关 API 契约（`itsm.api`）。
  - 新增微服务 `app/itsm`（或集成至 `app/worker` 中），建立与 `app/user`（人员/部门/角色）的模型与 RPC 依赖。
  - 新增数据库表（流程定义表、流程实例表、任务流转表、工单数据表、SLA 策略表等）。
