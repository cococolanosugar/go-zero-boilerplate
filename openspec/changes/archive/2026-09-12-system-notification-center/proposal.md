## Why

在企业中后台管理系统中，系统通知公告是全员信息同步、运维提醒与待办下发的核心中枢（对标 LinaPro、RuoYi 等企业级标杆）。目前脚手架管理后台顶部右上角已内置 Ant Design 6.x 的 NoticeIcon 铃铛组件，但由于缺少后端实体表与接口，仍处于静态 Mock 阶段，且管理员缺少发布、维护和下线通知公告的页面。

本次改造将依托刚刚建成的「Atlas 数据库版本化迁移」与「全栈 CRUD 代码生成器」，快速建立 `sys_notice` 数据流，打通「管理端发布公告 -> 员工端铃铛实时拉取 -> 标记已读与清空」的企业级完整闭环。

## What Changes

- **数据库增量迁移 (Atlas)**：通过 `just migrate-new create_sys_notice` 创建带时间戳迁移脚本，建立 `sys_notice`（通知公告表）与 `sys_notice_read`（用户通知已读记录表），并通过 `just migrate-up` 应用入库。
- **通知管理端全栈代码生成**：运行 `just gen-crud user sys_notice`，一键生成 Model (Cache-Aside)、微服务 RPC (CRUD)、统一网关 RESTful API、前端 `@zero/api` SDK 与管理员 `SysNotice` ProTable 页面。
- **员工端消费专用接口扩展**：在微服务与网关增加员工端专用接口（获取当前用户通知列表、未读徽标计数、单条标记已读、一键全部标记已读）。
- **前端 NoticeIcon 真实动态接入**：将 `frontend/apps/admin/src/components/RightContent/NoticeIcon.tsx` 从 Mock 切换为实时调用网关接口，支持按「通知 / 消息 / 待办」分类渲染、未读红点同步、点击已读与详情查看。
- **质量门禁与端到端检验**：通过 `just lint-antd` 确保前端 0 警告，通过 `just test-frontend` 确保单测全通过，并使用 Chrome DevTools 验证“管理后台发布通知 -> 右上角铃铛出现红点并查看”的端到端交互。

## Capabilities

### New Capabilities
- `system-notification`: 提供企业级系统通知公告管理与员工端通知中心，涵盖公告生命周期管理（发布/编辑/下线）、多分类通知（通知/消息/待办）、未读徽标与已读状态流转。

### Modified Capabilities
<!-- 无现有 capability 需求发生破坏性变更 -->

## Impact

- **数据库**：新增 `sys_notice` 与 `sys_notice_read` 表。
- **后端微服务与网关**：`app/user`（Model/RPC）与 `app/gateway`（RESTful 路由、JWT 注入与权限拦截）。
- **前端 SDK**：`frontend/packages/api` 新增通知相关强类型调用函数。
- **前端界面**：新增 `frontend/apps/admin/src/pages/SysNotice/index.tsx` 管理页；升级 `frontend/apps/admin/src/components/RightContent/NoticeIcon.tsx` 为动态消费组件；更新 `routes.ts` 注册路由。
