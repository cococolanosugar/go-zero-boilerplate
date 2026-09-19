-- ====================================================================
-- Titan 研发交付平台：Zadig 模型重构（项目-应用-代码仓-制品-K8s发布）
-- ====================================================================

-- 1. 项目表 (Project)
CREATE TABLE IF NOT EXISTS `titan_project` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `name` varchar(64) NOT NULL COMMENT '项目唯一英文标识（如 shop-system）',
  `display_name` varchar(128) NOT NULL COMMENT '项目显示名称',
  `description` varchar(255) NOT NULL DEFAULT '' COMMENT '项目描述',
  `owner_id` bigint NOT NULL DEFAULT 0 COMMENT '负责人ID',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态 1:正常 2:归档',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Titan交付项目表';

-- 2. 应用/微服务定义表 (Application / Service)
CREATE TABLE IF NOT EXISTS `titan_app` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '应用ID',
  `project_id` bigint NOT NULL COMMENT '所属项目ID',
  `name` varchar(64) NOT NULL COMMENT '应用英文标识（如 user-rpc）',
  `display_name` varchar(128) NOT NULL COMMENT '应用显示名称',
  `description` varchar(255) NOT NULL DEFAULT '' COMMENT '应用描述',
  `integration_id` bigint NOT NULL DEFAULT 0 COMMENT '代码仓凭证ID (关联 titan_integration)',
  `repo_url` varchar(255) NOT NULL DEFAULT '' COMMENT 'Git代码仓完整克隆地址',
  `default_branch` varchar(64) NOT NULL DEFAULT 'main' COMMENT '默认分支',
  `build_config` json NOT NULL COMMENT '构建策略: { dockerfilePath, contextPath, baseImage, buildArgs, envVars }',
  `deploy_spec` longtext NOT NULL COMMENT 'K8s部署编排模版YAML (包含 {{.IMAGE}}, {{.APP_NAME}} 变量)',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态 1:启用 2:停用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proj_app` (`project_id`, `name`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Titan微服务应用定义表';

-- 3. 项目交付环境表 (Environment)
CREATE TABLE IF NOT EXISTS `titan_env` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '环境ID',
  `project_id` bigint NOT NULL COMMENT '所属项目ID',
  `env_code` varchar(32) NOT NULL COMMENT '环境标识代码: dev / qa / staging / prod',
  `name` varchar(64) NOT NULL COMMENT '环境名称 (如 开发环境、生产环境)',
  `cluster_id` bigint NOT NULL COMMENT '关联物理K8s集群ID (titan_cluster)',
  `namespace` varchar(64) NOT NULL COMMENT '对应的Kubernetes命名空间',
  `status` varchar(32) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE, CREATING, DELETED',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proj_env` (`project_id`, `env_code`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_cluster_id` (`cluster_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Titan项目交付环境表';

-- 4. 不可变制品库 (Artifact / Image)
CREATE TABLE IF NOT EXISTS `titan_artifact` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '制品ID',
  `project_id` bigint NOT NULL COMMENT '所属项目ID',
  `app_id` bigint NOT NULL COMMENT '所属应用ID',
  `image_url` varchar(255) NOT NULL COMMENT '镜像全名(包含registry与仓库名)',
  `image_tag` varchar(128) NOT NULL COMMENT '制品Tag (如 v1.0.0 或 git-7fa9b2)',
  `image_digest` varchar(128) NOT NULL DEFAULT '' COMMENT '镜像SHA256摘要',
  `git_branch` varchar(64) NOT NULL DEFAULT '' COMMENT '构建源码分支',
  `git_commit` varchar(64) NOT NULL DEFAULT '' COMMENT '构建源码Commit Hash',
  `commit_msg` varchar(255) NOT NULL DEFAULT '' COMMENT '提交说明',
  `build_exec_id` bigint NOT NULL DEFAULT 0 COMMENT '生成的执行工作流ID',
  `image_size_bytes` bigint NOT NULL DEFAULT 0 COMMENT '镜像大小',
  `status` varchar(32) NOT NULL DEFAULT 'AVAILABLE' COMMENT '状态: AVAILABLE, EXPIRED',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_app_tag` (`app_id`, `image_tag`),
  KEY `idx_proj_app` (`project_id`, `app_id`),
  KEY `idx_git_commit` (`git_commit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Titan不可变制品库';

-- 5. 环境应用运行态绑定表 (Environment Application Binding)
CREATE TABLE IF NOT EXISTS `titan_env_app_binding` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `env_id` bigint NOT NULL COMMENT '环境ID',
  `app_id` bigint NOT NULL COMMENT '应用ID',
  `current_artifact_id` bigint NOT NULL DEFAULT 0 COMMENT '当前运行的制品ID',
  `ready_replicas` int NOT NULL DEFAULT 0 COMMENT '就绪Pod副本数',
  `total_replicas` int NOT NULL DEFAULT 0 COMMENT '期望总副本数',
  `status` varchar(32) NOT NULL DEFAULT 'PENDING' COMMENT '状态: RUNNING, UPDATING, FAILED, STOPPED',
  `last_deployed_time` datetime DEFAULT NULL COMMENT '最后一次部署时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_env_app` (`env_id`, `app_id`),
  KEY `idx_env_id` (`env_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Titan环境应用运行态绑定表';

-- 初始种子数据预置
INSERT IGNORE INTO `titan_project` (`id`, `name`, `display_name`, `description`, `owner_id`, `status`)
VALUES 
  (1, 'shop-system', '微服务电商中台', '包含网关、用户中心、订单微服务的高并发微服务集群', 1, 1),
  (2, 'ai-agent-hub', 'AI Agent 协同调度平台', '基于大模型的智能协同平台与工作流流水线', 1, 1);

INSERT IGNORE INTO `titan_app` (`id`, `project_id`, `name`, `display_name`, `description`, `integration_id`, `repo_url`, `default_branch`, `build_config`, `deploy_spec`, `status`)
VALUES
  (1, 1, 'order-service', '订单中心微服务', '处理电商交易、履约与退款状态机', 1, 'https://github.com/cococolanosugar/go-zero-boilerplate.git', 'main', 
  '{"dockerfilePath":"app/order/Dockerfile","contextPath":".","baseImage":"golang:1.24-alpine","buildArgs":{"CGO_ENABLED":"0"}}',
  'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: order-service\n  labels:\n    app: order-service\nspec:\n  replicas: {{.REPLICAS}}\n  selector:\n    matchLabels:\n      app: order-service\n  template:\n    metadata:\n      labels:\n        app: order-service\n    spec:\n      containers:\n      - name: app\n        image: {{.IMAGE}}\n        ports:\n        - containerPort: 8080\n', 1),
  (2, 1, 'gateway', '统一 API 网关', '全站唯一对外暴露的流量接入与鉴权中心', 1, 'https://github.com/cococolanosugar/go-zero-boilerplate.git', 'main',
  '{"dockerfilePath":"app/gateway/Dockerfile","contextPath":".","baseImage":"golang:1.24-alpine","buildArgs":{"CGO_ENABLED":"0"}}',
  'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: gateway\n  labels:\n    app: gateway\nspec:\n  replicas: {{.REPLICAS}}\n  selector:\n    matchLabels:\n      app: gateway\n  template:\n    metadata:\n      labels:\n        app: gateway\n    spec:\n      containers:\n      - name: app\n        image: {{.IMAGE}}\n        ports:\n        - containerPort: 8888\n', 1);

INSERT IGNORE INTO `titan_env` (`id`, `project_id`, `env_code`, `name`, `cluster_id`, `namespace`, `status`)
VALUES
  (1, 1, 'dev', '联调开发环境', 1, 'shop-dev', 'ACTIVE'),
  (2, 1, 'staging', '预发布测试环境', 2, 'shop-staging', 'ACTIVE'),
  (3, 1, 'prod', '生产环境', 3, 'shop-prod', 'ACTIVE');

INSERT IGNORE INTO `titan_artifact` (`id`, `project_id`, `app_id`, `image_url`, `image_tag`, `image_digest`, `git_branch`, `git_commit`, `commit_msg`, `build_exec_id`, `image_size_bytes`, `status`)
VALUES
  (1, 1, 1, 'registry.company.internal/shop/order-service', 'v1.0.0-git-3115943', 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', 'main', '3115943a', 'feat: 增加订单履约状态机', 1, 45210000, 'AVAILABLE'),
  (2, 1, 2, 'registry.company.internal/shop/gateway', 'v1.0.0-git-3115943', 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'main', '3115943a', 'feat: 优化统一鉴权中间件', 1, 38100000, 'AVAILABLE');

INSERT IGNORE INTO `titan_env_app_binding` (`id`, `env_id`, `app_id`, `current_artifact_id`, `ready_replicas`, `total_replicas`, `status`, `last_deployed_time`)
VALUES
  (1, 1, 1, 1, 2, 2, 'RUNNING', NOW() - INTERVAL 2 HOUR),
  (2, 1, 2, 2, 2, 2, 'RUNNING', NOW() - INTERVAL 2 HOUR);
