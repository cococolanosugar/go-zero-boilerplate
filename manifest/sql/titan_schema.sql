-- ====================================================================
-- Titan 研发交付平台核心数据表 DDL
-- ====================================================================

CREATE TABLE `titan_integration` (
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

CREATE TABLE `titan_cluster` (
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

CREATE TABLE `titan_pipeline` (
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

CREATE TABLE `titan_pipeline_exec` (
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

CREATE TABLE `titan_pipeline_step_exec` (
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

CREATE TABLE `titan_project` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `display_name` varchar(128) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `owner_id` bigint NOT NULL DEFAULT 0,
  `status` tinyint NOT NULL DEFAULT 1,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `titan_app` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `project_id` bigint NOT NULL,
  `name` varchar(64) NOT NULL,
  `display_name` varchar(128) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `integration_id` bigint NOT NULL DEFAULT 0,
  `repo_url` varchar(255) NOT NULL DEFAULT '',
  `default_branch` varchar(64) NOT NULL DEFAULT 'main',
  `build_config` json NOT NULL,
  `deploy_spec` longtext NOT NULL,
  `status` tinyint NOT NULL DEFAULT 1,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proj_app` (`project_id`, `name`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `titan_env` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `project_id` bigint NOT NULL,
  `env_code` varchar(32) NOT NULL,
  `name` varchar(64) NOT NULL,
  `cluster_id` bigint NOT NULL,
  `namespace` varchar(64) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'ACTIVE',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proj_env` (`project_id`, `env_code`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_cluster_id` (`cluster_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `titan_artifact` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `project_id` bigint NOT NULL,
  `app_id` bigint NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `image_tag` varchar(128) NOT NULL,
  `image_digest` varchar(128) NOT NULL DEFAULT '',
  `git_branch` varchar(64) NOT NULL DEFAULT '',
  `git_commit` varchar(64) NOT NULL DEFAULT '',
  `commit_msg` varchar(255) NOT NULL DEFAULT '',
  `build_exec_id` bigint NOT NULL DEFAULT 0,
  `image_size_bytes` bigint NOT NULL DEFAULT 0,
  `status` varchar(32) NOT NULL DEFAULT 'AVAILABLE',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_app_tag` (`app_id`, `image_tag`),
  KEY `idx_proj_app` (`project_id`, `app_id`),
  KEY `idx_git_commit` (`git_commit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `titan_env_app_binding` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `env_id` bigint NOT NULL,
  `app_id` bigint NOT NULL,
  `current_artifact_id` bigint NOT NULL DEFAULT 0,
  `ready_replicas` int NOT NULL DEFAULT 0,
  `total_replicas` int NOT NULL DEFAULT 0,
  `status` varchar(32) NOT NULL DEFAULT 'PENDING',
  `last_deployed_time` datetime DEFAULT NULL,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_env_app` (`env_id`, `app_id`),
  KEY `idx_env_id` (`env_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

