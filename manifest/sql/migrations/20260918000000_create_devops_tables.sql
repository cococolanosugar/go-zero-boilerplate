-- Create Titan DevOps Tables
CREATE TABLE IF NOT EXISTS `devops_integration` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `category` varchar(64) NOT NULL DEFAULT 'git',
  `auth_type` varchar(32) NOT NULL DEFAULT 'token',
  `config` json NOT NULL,
  `status` tinyint NOT NULL DEFAULT 1,
  `description` varchar(255) NOT NULL DEFAULT '',
  `created_by` bigint NOT NULL DEFAULT 0,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `devops_cluster` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `env` varchar(32) NOT NULL DEFAULT 'dev',
  `api_endpoint` varchar(255) NOT NULL DEFAULT '',
  `kubeconfig` text NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'HEALTHY',
  `version` varchar(32) NOT NULL DEFAULT '',
  `description` varchar(255) NOT NULL DEFAULT '',
  `created_by` bigint NOT NULL DEFAULT 0,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_env` (`env`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `devops_pipeline` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `display_name` varchar(128) NOT NULL DEFAULT '',
  `category` varchar(64) NOT NULL DEFAULT 'microservice',
  `git_repo` varchar(255) NOT NULL DEFAULT '',
  `git_branch` varchar(128) NOT NULL DEFAULT 'master',
  `stages` json NOT NULL,
  `params` json NOT NULL,
  `triggers` json NOT NULL,
  `status` tinyint NOT NULL DEFAULT 1,
  `description` varchar(255) NOT NULL DEFAULT '',
  `created_by` bigint NOT NULL DEFAULT 0,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `devops_pipeline_exec` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pipeline_id` bigint NOT NULL DEFAULT 0,
  `pipeline_name` varchar(128) NOT NULL DEFAULT '',
  `exec_no` varchar(64) NOT NULL DEFAULT '',
  `trigger_type` varchar(32) NOT NULL DEFAULT 'MANUAL',
  `trigger_by` bigint NOT NULL DEFAULT 0,
  `git_branch` varchar(128) NOT NULL DEFAULT '',
  `git_commit` varchar(64) NOT NULL DEFAULT '',
  `runtime_params` json NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'PENDING',
  `workflow_id` varchar(128) NOT NULL DEFAULT '',
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration_ms` bigint NOT NULL DEFAULT 0,
  `artifacts` json NOT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exec_no` (`exec_no`),
  KEY `idx_pipeline_status` (`pipeline_id`, `status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `devops_pipeline_step_exec` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `exec_id` bigint NOT NULL DEFAULT 0,
  `stage_id` varchar(64) NOT NULL DEFAULT '',
  `step_id` varchar(64) NOT NULL DEFAULT '',
  `step_name` varchar(128) NOT NULL DEFAULT '',
  `step_type` varchar(32) NOT NULL DEFAULT 'BUILD',
  `status` varchar(32) NOT NULL DEFAULT 'PENDING',
  `log_path` varchar(255) NOT NULL DEFAULT '',
  `error_msg` text NOT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration_ms` bigint NOT NULL DEFAULT 0,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_exec_stage` (`exec_id`, `stage_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
