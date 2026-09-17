# 基于 BPMN 2.0 与 Ant Design ProComponents 的全栈 ITSM 服务管理系统设计方案

本文档详细记录 `go-zero-boilerplate` 企业级 Monorepo 中 **ITSM（IT 服务管理）系统** 的整体架构设计、前后端协同模型、BPMN 2.0 拓扑解析引擎、SLA 履约计时以及工程落地细节。

---

## 1. 系统架构总览

现代企业级 IT 服务管理涵盖事件申报、故障报修、运维变更、权限开通、资产申领等多类工作流。系统采用 **Go 全栈轻量级微服务 + React 18 / Ant Design 6.x / ProComponents 前端** 架构：

```text
                                +---------------------------------------------------------+
                                |               前端管理后台 (apps/admin :3001)            |
                                |  - BPMN 流程设计器 (BpmnModeler + BpmnPropertiesDrawer) |
                                |  - 动态业务表单引擎 (BetaSchemaForm + 权限矩阵过滤)     |
                                |  - 工单全生命周期工作台 (ProTable: 待办/已办/预警)      |
                                |  - 流程流转可视化轨迹查看器 (NavigatedViewer + 状态高亮)|
                                +----------------------------+----------------------------+
                                                             | HTTP RESTful
                                                             | @zero/api 强类型 SDK
                                                             v
                                +---------------------------------------------------------+
                                |                统一网关 BFF (app/gateway :8888)         |
                                |  - RESTful 路由映射 (/api/v1/itsm/*)                    |
                                |  - JWT 鉴权与 RBAC 切面拦截                             |
                                |  - 统一 HTTP 响应结构包装 (pkg/result)                  |
                                +----------------------------+----------------------------+
                                                             | gRPC
                                                             v
                                +---------------------------------------------------------+
                                |               ITSM 核心微服务 (app/itsm/rpc :8084)      |
                                |  - BPMN 2.0 XML 拓扑解析与 DAG 连通性校验器             |
                                |  - 工单生命周期状态机 (认领/审批/驳回/转派/加签/终止)   |
                                |  - 节点字段权限矩阵鉴权引擎                             |
                                |  - 工单与流转审计日志持久化                             |
                                +--------------+----------------------------+-------------+
                                               |                            |
                     SLA Timer Workflow 派发   |                            | 数据库持久化
                                               v                            v
                                +-----------------------------+   +-----------------------+
                                | 异步 Worker (app/worker)    |   | MySQL 8.0 持久层      |
                                | - Temporal 分布式定时器     |   | - itsm_process_def    |
                                | - SLA 预警与超时升级活动    |   | - itsm_process_inst   |
                                | - 站内信/邮件超时通知触达   |   | - itsm_task           |
                                +-----------------------------+   | - itsm_ticket_data    |
                                                                  | - itsm_task_log       |
                                                                  | - itsm_sla_policy     |
                                                                  +-----------------------+
```

---

## 2. 后端流程引擎与数据模型设计

### 2.1 核心数据表设计
1. **`itsm_process_def`（流程定义表）**：存储流程编码、流程名称、服务分类、BPMN 2.0 XML 拓扑原件、JSON Schema 动态表单配置与版本号（草稿/已发布状态控制）。
2. **`itsm_process_inst`（工单实例表）**：记录唯一流水单号（`INC+年月日时分秒+随机码`）、工单标题、P1~P4 优先级、提报发起人、当前激活节点标识、生命周期状态（`PENDING`/`RUNNING`/`APPROVED`/`REJECTED`/`REVOKED`/`CLOSED`）及 SLA 响应/解决截止期限。
3. **`itsm_task`（任务节点流转表）**：记录节点当前办理人（`assignee_id`）、审批模式（`SINGLE` 单人、`OR_SIGN` 或签、`COUNTER_SIGN` 会签）、任务状态（`READY` 待认领、`CLAIMED` 办理中、`COMPLETED` 已办结、`REJECTED` 已驳回、`TRANSFERRED` 已转派）。
4. **`itsm_ticket_data`（工单动态数据表）**：采用 JSON/JSONB 字段存储业务提报字段的实时键值与创建时刻的表单定义快照。
5. **`itsm_task_log`（流转审计日志表）**：不可篡改记录每次流转的操作人、动作类型（`CREATE`/`CLAIM`/`APPROVE`/`REJECT`/`TRANSFER`/`CANCEL`）、签署批注与耗时。
6. **`itsm_sla_policy`（SLA 策略表）**：依据 P1~P4 优先级定义响应限时（分钟）、解决限时（分钟）与预警阈值比例（如 80%）。

### 2.2 BPMN 2.0 XML 基础解析与拓扑计算
位于 [app/itsm/rpc/internal/engine/bpmn.go](file:///D:/work/go-zero-boilerplate/app/itsm/rpc/internal/engine/bpmn.go)：
- **拓扑校验**：验证流程图包含有效的 `startEvent`、`endEvent`，校验所有 `sequenceFlow` 的 `sourceRef` 与 `targetRef` 均在有效节点集合中。
- **分支条件表达式**：支持 `exclusiveGateway`（排他网关）评估连线上的条件（如 `${approved == true}`、`${approved == false}`、`${priority == 'P1'}`），动态计算下一步激活的目标节点。

### 2.3 Temporal SLA 定时器协作
位于 [app/worker/contract/itsm_sla.go](file:///D:/work/go-zero-boilerplate/app/worker/contract/itsm_sla.go)：
- 创建工单后，异步触发 `ItsmSlaWorkflow`。
- 工作流在预警时间（`warn_threshold_pct`）休眠后唤醒，执行预警检查与通知；若到达截止时间仍未办结，触发超时升级活动（标记工单 `sla_status = 'TIMEOUT'` 并派发升级通知）。

---

## 3. 前端设计与 ProComponents 落地

### 3.1 Headless bpmn-js + Ant Design 6.x 自定义属性面板
- **设计决策**：摒弃样式割裂的原生 DOM 属性面板，采用 `bpmn-js/lib/Modeler` + React 属性抽屉 `BpmnPropertiesDrawer`。
- **扩展读写规范**：节点审批人类型（指定人员/候选角色/部门主管）、会签通过阈值与节点字段权限矩阵通过 BPMN 2.0 标准 `<documentation>` 结构化序列化与读取，确保生成的 BPMN XML 100% 具备标准跨平台兼容性。

### 3.2 动态表单与字段权限矩阵
- **组件封装**：[frontend/apps/admin/src/components/DynamicForm/DynamicTicketForm.tsx](file:///D:/work/go-zero-boilerplate/frontend/apps/admin/src/components/DynamicForm/DynamicTicketForm.tsx) 基于 ProComponents 的 `BetaSchemaForm`。
- **权限切换**：
  - `hidden`：前端完全过滤该列；
  - `readonly`：动态设置 `readonly: true`；
  - `required`：动态注入 `rules: [{ required: true }]`；
  - `writable`：正常开放输入。

### 3.3 工单轨迹查看器
- **组件封装**：[frontend/apps/admin/src/components/Bpmn/BpmnViewer.tsx](file:///D:/work/go-zero-boilerplate/frontend/apps/admin/src/components/Bpmn/BpmnViewer.tsx) 基于 `bpmn-js/lib/NavigatedViewer`。
- **视觉反馈**：
  - 绿色高亮：已办结节点（`node-completed`）；
  - 蓝色呼吸脉冲：当前办理中节点（`node-active`）；
  - 红色描边：驳回节点（`node-rejected`）；
  - Overlays 气泡：动态挂载最后一次操作人与签署动作。

---

## 4. 路由与菜单配置

在前端 `apps/admin` 的静态路由表与多语言字典中完成挂载：
- `/itsm/tickets`：工单工作台（支持多 Tab：我的待办、我的已办、我发起的、全部工单、SLA 预警工单）；
- `/itsm/tickets/:id`：工单综合详情页（左侧动态表单/时间轴，右侧 BPMN 可视化轨迹图，头部提供认领、审批、驳回、转派、撤销全套操作）；
- `/itsm/process-defs`：流程服务目录与一键部署发布管理。

---

## 5. 质量保证与验证记录

- **单元测试覆盖**：
  - BPMN DAG 拓扑解析与条件流转测试：`app/itsm/rpc/internal/engine/bpmn_test.go` (100% PASS)
  - 跨部门流转与状态机生命周期测试：`app/itsm/rpc/internal/logic/itsm/statemachine_test.go` (100% PASS)
  - Temporal SLA 定时器工作流测试：`app/worker/rpc/internal/workflows/itsm_sla_workflow_test.go` (100% PASS)
- **前端测试与规范**：
  - 前端全量 Vitest 单元测试：154 / 154 测试通过（100% PASS）。
  - Ant Design 6.x 静态规范诊断：`antd lint ./frontend/apps/admin/src` 扫描 91 个文件，**0 警告 0 废弃项**。
  - 生产包构建：`tsc && vite build` 30 秒打包完成，生成轻量独立异步分包 `vendor-bpmn.js`。
