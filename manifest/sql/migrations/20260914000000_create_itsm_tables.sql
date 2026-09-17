-- ITSM 核心数据表结构定义与初始 SLA 策略数据

CREATE TABLE IF NOT EXISTS `itsm_process_def` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '流程定义ID',
  `proc_code` varchar(64) NOT NULL COMMENT '流程唯一标识编码',
  `proc_name` varchar(128) NOT NULL COMMENT '流程名称',
  `category` varchar(64) NOT NULL DEFAULT 'common' COMMENT '流程分类(it_service, devops, permission, etc.)',
  `bpmn_xml` longtext NOT NULL COMMENT 'BPMN 2.0 XML 内容',
  `form_schema` json NOT NULL COMMENT '动态表单 JSON Schema 定义',
  `version` int NOT NULL DEFAULT 1 COMMENT '版本号',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态: 1-草稿, 2-已发布, 3-已停用',
  `description` varchar(255) DEFAULT '' COMMENT '流程描述',
  `created_by` bigint DEFAULT NULL COMMENT '创建人用户ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proc_code_version` (`proc_code`, `version`),
  KEY `idx_category_status` (`category`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ITSM 流程定义表';

CREATE TABLE IF NOT EXISTS `itsm_process_inst` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '工单流程实例ID',
  `proc_def_id` bigint NOT NULL COMMENT '绑定的流程定义ID',
  `ticket_no` varchar(64) NOT NULL COMMENT '工单流水号 (如 INC202609140001)',
  `title` varchar(255) NOT NULL COMMENT '工单标题',
  `priority` varchar(16) NOT NULL DEFAULT 'P3' COMMENT '优先级: P1-紧急, P2-高, P3-中, P4-低',
  `initiator_id` bigint NOT NULL COMMENT '工单发起人ID',
  `current_node_id` varchar(64) DEFAULT '' COMMENT '当前停滞的处理节点ID',
  `current_node_name` varchar(128) DEFAULT '' COMMENT '当前处理节点名称',
  `status` varchar(32) NOT NULL DEFAULT 'RUNNING' COMMENT '工单状态: RUNNING, APPROVED, REJECTED, REVOKED, CLOSED',
  `sla_status` varchar(32) NOT NULL DEFAULT 'NORMAL' COMMENT 'SLA状态: NORMAL, WARNING, BREACHED',
  `sla_response_deadline` datetime DEFAULT NULL COMMENT 'SLA响应截止时间',
  `sla_resolve_deadline` datetime DEFAULT NULL COMMENT 'SLA解决截止时间',
  `first_response_at` datetime DEFAULT NULL COMMENT '首次响应时间',
  `resolved_at` datetime DEFAULT NULL COMMENT '解决完成时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ticket_no` (`ticket_no`),
  KEY `idx_initiator_status` (`initiator_id`, `status`),
  KEY `idx_status_created` (`status`, `created_at`),
  KEY `idx_sla_status` (`sla_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ITSM 工单流程实例表';

CREATE TABLE IF NOT EXISTS `itsm_task` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '任务节点ID',
  `inst_id` bigint NOT NULL COMMENT '工单实例ID',
  `node_id` varchar(64) NOT NULL COMMENT 'BPMN 节点唯一ID',
  `node_name` varchar(128) NOT NULL COMMENT '节点名称',
  `task_type` varchar(32) NOT NULL DEFAULT 'USER_TASK' COMMENT '任务类型: USER_TASK, GATEWAY, SERVICE_TASK',
  `approval_mode` varchar(32) NOT NULL DEFAULT 'SINGLE' COMMENT '审批模式: SINGLE(单人), OR_SIGN(或签), COUNTER_SIGN(会签)',
  `assignee_id` bigint DEFAULT NULL COMMENT '实际认领/办理人ID',
  `candidate_users` json DEFAULT NULL COMMENT '候选人用户ID列表',
  `candidate_roles` json DEFAULT NULL COMMENT '候选角色列表',
  `status` varchar(32) NOT NULL DEFAULT 'READY' COMMENT '任务状态: READY, CLAIMED, COMPLETED, REJECTED, TRANSFERRED',
  `claim_at` datetime DEFAULT NULL COMMENT '认领时间',
  `completed_at` datetime DEFAULT NULL COMMENT '办结时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inst_status` (`inst_id`, `status`),
  KEY `idx_assignee_status` (`assignee_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ITSM 节点任务表';

CREATE TABLE IF NOT EXISTS `itsm_ticket_data` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `inst_id` bigint NOT NULL COMMENT '关联工单实例ID',
  `form_data` json NOT NULL COMMENT '动态表单提交键值对',
  `snapshot_schema` json DEFAULT NULL COMMENT '工单发起时的表单结构快照',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inst_id` (`inst_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ITSM 工单动态表单数据表';

CREATE TABLE IF NOT EXISTS `itsm_task_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '审计日志ID',
  `inst_id` bigint NOT NULL COMMENT '工单实例ID',
  `task_id` bigint DEFAULT NULL COMMENT '关联任务ID',
  `node_id` varchar(64) NOT NULL COMMENT '节点ID',
  `node_name` varchar(128) NOT NULL COMMENT '节点名称',
  `operator_id` bigint NOT NULL COMMENT '操作人ID',
  `operator_name` varchar(64) DEFAULT '' COMMENT '操作人姓名',
  `action_type` varchar(32) NOT NULL COMMENT '操作类型: CREATE, CLAIM, APPROVE, REJECT, TRANSFER, ADD_SIGN, REVOKE',
  `opinion` text DEFAULT NULL COMMENT '审批/流转处理意见',
  `duration_sec` int DEFAULT 0 COMMENT '处理耗时(秒)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inst_created` (`inst_id`, `created_at`),
  KEY `idx_operator` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ITSM 工单流转审计日志表';

CREATE TABLE IF NOT EXISTS `itsm_sla_policy` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `priority` varchar(16) NOT NULL COMMENT '优先级 P1~P4',
  `calendar_type` varchar(32) NOT NULL DEFAULT 'WORKING_HOURS' COMMENT '24X7 / WORKING_HOURS',
  `response_limit_min` int NOT NULL COMMENT '响应时限(分钟)',
  `resolve_limit_min` int NOT NULL COMMENT '解决时限(分钟)',
  `warn_threshold_pct` int NOT NULL DEFAULT 80 COMMENT '预警阈值百分比',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_priority_calendar` (`priority`, `calendar_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ITSM SLA 策略表';

-- 插入默认 SLA 策略 (工作日与 24x7 两种日历模式)
INSERT IGNORE INTO `itsm_sla_policy` (`id`, `priority`, `calendar_type`, `response_limit_min`, `resolve_limit_min`, `warn_threshold_pct`)
VALUES
  (1, 'P1', '24X7', 15, 120, 80),
  (2, 'P2', 'WORKING_HOURS', 30, 240, 80),
  (3, 'P3', 'WORKING_HOURS', 60, 480, 80),
  (4, 'P4', 'WORKING_HOURS', 120, 1440, 80);
