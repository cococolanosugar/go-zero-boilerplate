## Context

本项目是基于 Go (`go-zero`) 与 React (`Ant Design 6.x` + `ProComponents`) 的企业级全栈 Monorepo。在构建现代化的企业级 ITSM（IT 服务管理）系统时，核心挑战在于如何将标准业务流程建模（BPMN 2.0）、灵活的动态业务表单、严密的审批与流转逻辑、SLA 服务时效治理与优雅的企业级前端界面无缝整合。

本设计方案针对 ITSM 系统的全链路架构进行深度解构，涵盖前端交互层（bpmn-js 建模器/轨迹查看器、ProComponents 动态表单、工单中心）、后端引擎与数据层（BPMN 状态机、领域数据模型、Temporal 定时器协作）以及系统集成层。

## Goals / Non-Goals

**Goals:**
- **BPMN 2.0 可视化建模与定制属性面板**：基于 `bpmn-js` Modeler 封装与 Ant Design 6.x 视觉高度协同的设计器，支持自定义节点属性面板（审批人规则、会签比例、表单绑定、字段权限矩阵）。
- **动态表单与节点字段权限控制**：基于 ProComponents `BetaSchemaForm` 打造 JSON Schema 驱动的动态表单引擎，在各审批节点实现字段级别的只读、必填、隐藏与编辑控制。
- **工单流转与可视化轨迹追踪**：基于 `NavigatedViewer` 呈现工单流转全景图，实现已完成（绿色）、当前办理（高亮闪烁）、驳回（红色）节点的状态高亮与处理详情悬浮卡片。
- **高可用与轻量后端架构**：在 `app/itsm` RPC 服务中提供轻量级 BPMN 2.0 解析与状态机流转能力，结合 `app/worker` 的 Temporal 引擎实现 SLA 超时计时与异步任务派发。
- **端到端 ITSM 工单中心**：基于 `ProTable` + `PageContainer` 提供待办、已办、发起、转派、加签、催办等完整业务闭环。

**Non-Goals:**
- 不引入重型的第三方 Java 工作流引擎（如 Camunda/Flowable 独立服务），保持 Go 全栈与 Monorepo 的轻量纯粹性。
- 不在本阶段实现全量复杂 BPMN 规范（如消息补偿、事务子流程等边缘特性），聚焦于 IT 服务管理核心的 UserTask、ExclusiveGateway、ParallelGateway 规范子集。
- 不构建复杂的 CMDB 资产自动巡检采集引擎，仅提供标准资产对象与工单的关联引用接口。

## Decisions

### 1. 前端 bpmn-js 集成架构与自定义属性面板 (Property Panel)
- **技术决策**：采用 Headless `bpmn-js/lib/Modeler` + 自研 React/Ant Design 属性面板抽屉/侧边栏，不采用官方默认的 `bpmn-js-properties-panel`。
- **架构考量**：
  - 官方 `bpmn-js-properties-panel` 使用原生 DOM 驱动，与 Ant Design 6.x 主题、暗色模式、响应式布局割裂，且无法复用 Ant Design 的人员选择器、部门树、字典下拉等组件。
  - 通过监听 `modeler.get('eventBus')` 的 `selection.changed` 事件，捕获当前选中节点（`element.businessObject`）；通过 `moddle` 自定义命名空间扩展元素（`extensionElements`，命名空间如 `itsm:ApprovalConfig`, `itsm:FieldPermissions`）进行结构化读写，实现 100% Ant Design 交互与 BPMN 标准 XML 文件的双向同步。

```
+-------------------------------------------------------------------------+
|                              ITSM 流程设计器                            |
+------------------------------------+------------------------------------+
|            bpmn-js 画布            |    Ant Design 自定义属性面板       |
|  +------------------------------+  |  +------------------------------+  |
|  | (Start) -> [审批节点] -> (End)|  |  | 节点名称: 部门主管审批      |  |
|  |               ^              |  |  | 审批模式: 会签 (100%通过)    |  |
|  |            (选中)            |  |  | 候选人: 指定角色 [IT运维组]  |  |
|  +------------------------------+  |  | 字段权限: 故障描述(只读)...  |  |
|                  |                 |  +------------------------------+  |
|                  v (selection.changed)                | (commandStack)  |
|            Element Moddle <---------------------------+                 |
+-------------------------------------------------------------------------+
```

### 2. 动态表单体系 (Dynamic Form Engine)
- **技术决策**：采用基于 `@ant-design/pro-components` 的 `BetaSchemaForm` 方案，将表单定义抽象为结构化 JSON Schema。
- **字段权限矩阵设计**：
  - 流程设计时，针对每个 `UserTask` 配置字段权限映射表：
    ```json
    {
      "nodeId": "Activity_LeaderAudit",
      "permissions": {
        "title": "readonly",
        "description": "readonly",
        "priority": "readonly",
        "auditOpinion": "writable",
        "internalMemo": "hidden"
      }
    }
    ```
  - 前端工单渲染器解析该配置，动态调整 `SchemaForm` 的 `formItemProps.disabled`、`formItemProps.rules.required` 以及动态过滤 `hidden` 属性；
  - 后端网关与微服务执行严密鉴权：审批人在提交处理请求时，后端依据当前节点字段权限矩阵剔除只读与隐藏字段，防止抓包篡改未授权字段。

### 3. 后端流程执行引擎选型与架构 (Workflow Execution Engine)
- **方案对比与评估**：
  - **方案 A（外部 Camunda/Flowable 引擎）**：生态成熟，但需要部署独立 JVM/Spring Boot 进程，运维复杂度骤增，与 Monorepo 的轻量标准背离。
  - **方案 B（纯 Temporal 代码编排）**：Temporal 非常适合预编写代码的工作流，但不支持业务人员在浏览器拖拽 BPMN 图形并即时发布动态流程图。
  - **方案 C（Go BPMN 状态机 + Temporal 协同体系 - 推荐选型）**：
    - `app/itsm` 微服务实现轻量级 BPMN 2.0 XML 图形拓扑解析器与任务状态机：负责节点流转、会签计数、网关分支条件计算与工单生命周期维护。
    - 借助现存的 `app/worker`（内置 Temporal Worker）：将 SLA 超时计时、节点催办通知等长耗时异步任务封装为 Temporal Timer/Workflow，保证极致的故障恢复与分布式定时精度。

### 4. 核心领域数据模型设计 (Domain Models)

```
[itsm_process_def] (流程定义表)
  - id, proc_code, proc_name, category_id, bpmn_xml, form_schema, version, status

[itsm_process_inst] (工单实例表)
  - id, proc_def_id, ticket_no, title, priority (P1~P4), initiator_id, current_node_id, status (PENDING/RUNNING/APPROVED/REJECTED/REVOKED/CLOSED), created_at

[itsm_task] (任务节点流转表)
  - id, inst_id, node_id, node_name, task_type (USER_TASK/GATEWAY), approval_mode (SINGLE/OR_SIGN/COUNTER_SIGN), assignee_id, candidate_users, candidate_roles, status (READY/CLAIMED/COMPLETED/REJECTED/TRANSFERRED)

[itsm_ticket_data] (工单动态数据表)
  - id, inst_id, form_data (JSON/JSONB), snapshot_schema (JSON)

[itsm_task_log] (流转审计日志表)
  - id, inst_id, task_id, operator_id, action_type (CREATE/CLAIM/APPROVE/REJECT/TRANSFER/ADD_SIGN/CANCEL), opinion, duration_sec, created_at

[itsm_sla_policy] (SLA 策略表)
  - id, priority, calendar_type (CALENDAR_24X7 / WORKING_HOURS), response_limit_min, resolve_limit_min, warn_threshold_pct
```

### 5. 流程流转轨迹可视化与状态渲染 (Visual Trajectory)
- **技术决策**：使用 `bpmn-js/lib/NavigatedViewer`（只读缩放画布）。
- **节点高亮机制**：
  - 后端返回工单当前流转上下文：`{ activeNodeIds: [...], completedNodeIds: [...], rejectedNodeIds: [...] }`。
  - 前端利用 `canvas.addMarker(nodeId, 'node-highlight-success')` 为已完成节点注入描边与背景色，注入 `'node-highlight-active'`（主色边框 + 呼吸发光动画）。
  - 利用 `overlays.add(nodeId, ...)` 动态挂载处理人头像、处理意见 Popover 气泡，实现零侵入、高交互的流程回溯。

## Risks / Trade-offs

- **[Risk 1] `bpmn-js` 打包体积较大（~1.5MB）可能影响首屏加载速度**
  - **Mitigation**: 在 `apps/admin` 的 Vite 配置中使用动态 `import()` 路由懒加载，并通过 `manualChunks` 将 `bpmn-js` 与 `diagram-js` 独立拆分为 `vendor-bpmn.js` 异步包。
- **[Risk 2] 复杂 BPMN 语法（如嵌套子流程、补偿事件）导致自研状态机复杂度失控**
  - **Mitigation**: 严格限定支持的 BPMN 核心元素白名单（`StartEvent`, `EndEvent`, `UserTask`, `ExclusiveGateway`, `ParallelGateway`, `SequenceFlow`）。设计器在导出与发布时进行合规性语法检查，拦截不支持的高阶节点。
- **[Risk 3] 流程版本升级与历史运行中工单的兼容性**
  - **Mitigation**: 工单实例强绑定发起时的 `proc_def_id` 与版本快照，已发起的历史工单继续运行在旧版流程定义与表单结构上，新流程定义仅对发布后新发起的工单生效。
