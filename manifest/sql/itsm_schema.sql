CREATE TABLE `itsm_process_def` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `proc_code` varchar(64) NOT NULL DEFAULT '',
  `proc_name` varchar(128) NOT NULL DEFAULT '',
  `category` varchar(64) NOT NULL DEFAULT 'common',
  `bpmn_xml` longtext NOT NULL,
  `form_schema` json NOT NULL,
  `version` int NOT NULL DEFAULT 1,
  `status` tinyint NOT NULL DEFAULT 1,
  `description` varchar(255) NOT NULL DEFAULT '',
  `created_by` bigint NOT NULL DEFAULT 0,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proc_code_version` (`proc_code`, `version`),
  KEY `idx_category_status` (`category`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `itsm_process_inst` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `proc_def_id` bigint NOT NULL DEFAULT 0,
  `ticket_no` varchar(64) NOT NULL DEFAULT '',
  `title` varchar(255) NOT NULL DEFAULT '',
  `priority` varchar(16) NOT NULL DEFAULT 'P3',
  `initiator_id` bigint NOT NULL DEFAULT 0,
  `current_node_id` varchar(64) NOT NULL DEFAULT '',
  `current_node_name` varchar(128) NOT NULL DEFAULT '',
  `status` varchar(32) NOT NULL DEFAULT 'RUNNING',
  `sla_status` varchar(32) NOT NULL DEFAULT 'NORMAL',
  `sla_response_deadline` datetime DEFAULT NULL,
  `sla_resolve_deadline` datetime DEFAULT NULL,
  `first_response_at` datetime DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ticket_no` (`ticket_no`),
  KEY `idx_initiator_status` (`initiator_id`, `status`),
  KEY `idx_status_create` (`status`, `create_time`),
  KEY `idx_sla_status` (`sla_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `itsm_task` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inst_id` bigint NOT NULL DEFAULT 0,
  `node_id` varchar(64) NOT NULL DEFAULT '',
  `node_name` varchar(128) NOT NULL DEFAULT '',
  `task_type` varchar(32) NOT NULL DEFAULT 'USER_TASK',
  `approval_mode` varchar(32) NOT NULL DEFAULT 'SINGLE',
  `assignee_id` bigint DEFAULT NULL,
  `candidate_users` json DEFAULT NULL,
  `candidate_roles` json DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'READY',
  `claim_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inst_status` (`inst_id`, `status`),
  KEY `idx_assignee_status` (`assignee_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `itsm_ticket_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inst_id` bigint NOT NULL DEFAULT 0,
  `form_data` json NOT NULL,
  `snapshot_schema` json DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inst_id` (`inst_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `itsm_task_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inst_id` bigint NOT NULL DEFAULT 0,
  `task_id` bigint DEFAULT NULL,
  `node_id` varchar(64) NOT NULL DEFAULT '',
  `node_name` varchar(128) NOT NULL DEFAULT '',
  `operator_id` bigint NOT NULL DEFAULT 0,
  `operator_name` varchar(64) NOT NULL DEFAULT '',
  `action_type` varchar(32) NOT NULL DEFAULT '',
  `opinion` text DEFAULT NULL,
  `duration_sec` int NOT NULL DEFAULT 0,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inst_create` (`inst_id`, `create_time`),
  KEY `idx_operator` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `itsm_sla_policy` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `priority` varchar(16) NOT NULL DEFAULT 'P3',
  `calendar_type` varchar(32) NOT NULL DEFAULT 'WORKING_HOURS',
  `response_limit_min` int NOT NULL DEFAULT 60,
  `resolve_limit_min` int NOT NULL DEFAULT 480,
  `warn_threshold_pct` int NOT NULL DEFAULT 80,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_priority_calendar` (`priority`, `calendar_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
