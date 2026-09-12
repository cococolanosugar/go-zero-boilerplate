## Context

在完成全栈 CRUD 生成器与 Atlas 数据库版本化迁移基础设施后，系统通知公告作为企业中后台管理的核心基础能力，具备明确的业务价值（对标 LinaPro / RuoYi 等系统）。管理后台顶部已就绪 Ant Design 6.x 的 NoticeIcon 铃铛组件，需打通端到端数据流。

## Goals / Non-Goals

**Goals:**
- 采用 Atlas 创建增量迁移脚本，落盘 `sys_notice`（通知公告表）与 `sys_notice_read`（已读关联表）。
- 使用 `just gen-crud user sys_notice` 一键生成管理端的 Model、RPC、网关 BFF 与 ProTable 管理页。
- 扩展针对员工个人消费的 3 个专用 API：
  1. `GET /api/v1/user/notice/my-list`：获取当前员工的三分类通知列表与未读总数。
  2. `POST /api/v1/user/notice/read`：单条通知标记已读。
  3. `POST /api/v1/user/notice/read-all`：指定分类一键全部标记已读。
- 将前端管理后台顶部右上角 `NoticeIcon.tsx` 组件切换为直连网关 API，实现未读 Badge、卡片展示、已读消除与弹窗详情展示。
- 保证全仓前端通过 `just lint-antd`（0 警告）与 `just test-frontend`（100% 通过）。

**Non-Goals:**
- 本阶段不引入 WebSocket / SSE 长连接推送（采用初次加载、路由切换或按需拉取模式，长连接留待后续实时通信阶段）。
- 不支持短信、邮件等第三方外发渠道（聚焦于站内中后台通知）。

## Decisions

### 1. 已读状态表模型设计 (sys_notice_read)
* **方案 A（淘汰）**：在 `sys_notice` 表增加 JSON 字段或逗号分隔字段记录已读 `user_ids`。  
  *缺陷*：并发写冲突、单行数据膨胀、无法利用二级索引高效过滤。
* **方案 B（采纳）**：建立独立的已读关联表 `sys_notice_read`：
  ```sql
  CREATE TABLE `sys_notice_read` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `notice_id` bigint NOT NULL COMMENT '通知ID',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `read_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_notice_user` (`notice_id`, `user_id`),
    KEY `idx_user` (`user_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户通知已读记录表';
  ```
  *优势*：通过 `LEFT JOIN` 或 `WHERE NOT EXISTS` 毫秒级查出未读列表，支持批量 `INSERT IGNORE` 高效标记全部已读。

### 2. 利用 `just gen-crud` 快速构建管理端底座
* 核心实体 `sys_notice` 通过刚刚交付的 `just gen-crud user sys_notice` 直接生成：
  - Model（含缓存管理与分页过滤）；
  - 微服务 RPC CRUD（Create、Update、Delete、Get、List）；
  - 网关 RESTful 路由 `/api/v1/user/sys-notice`；
  - 自动注册 `/system/sys-notice` 到 `routes.ts`，管理员即刻拥有功能完备的通知维护界面。

### 3. 通知分类与 NoticeIcon 映射
* `notice_type` 枚举定义：
  - `1`：**通知 (Notification)**，如全员公告、集群状态、发版更新；
  - `2`：**消息 (Message)**，如权限变更、组织调动、业务通知；
  - `3`：**待办 (Task)**，如审批任务、超时报警、待办清单。
* 完美对齐前端 NoticeIcon 的 3 个 Tab 标签页。

## Risks / Trade-offs

- **[风险]** 历史通知过多导致员工已读比对性能下降  
  → **[规避]** 员工端接口限制仅拉取 `status = 1` 且创建时间在 90 天以内的有效通知，并限制最大拉取条数（如每类 20 条）。
- **[风险]** 一键全部标记已读在高并发下引起锁冲突  
  → **[规避]** 采用 `INSERT IGNORE INTO sys_notice_read (notice_id, user_id) SELECT id, ? FROM sys_notice WHERE status = 1`，避免先查后插的重复事务竞争。
