-- Titan 企业级交付与合规发布单表
CREATE TABLE IF NOT EXISTS `titan_release_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '发布单ID',
  `order_no` varchar(64) NOT NULL COMMENT '发布单号 (如 RO202609190001)',
  `project_id` bigint NOT NULL COMMENT '所属项目ID',
  `title` varchar(128) NOT NULL COMMENT '发布单标题',
  `description` varchar(255) NOT NULL DEFAULT '' COMMENT '发布说明',
  `target_env` varchar(32) NOT NULL COMMENT '目标环境 (dev, test, staging, prod)',
  `services_json` json NOT NULL COMMENT '变更服务及目标版本详情 JSON',
  `status` varchar(32) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, EXECUTING, SUCCESS, FAILED, CANCELED',
  `itsm_process_inst_id` bigint NOT NULL DEFAULT 0 COMMENT '关联ITSM流程实例ID',
  `applicant_id` bigint NOT NULL DEFAULT 0 COMMENT '申请人ID',
  `applicant_name` varchar(64) NOT NULL DEFAULT '' COMMENT '申请人姓名',
  `approver_id` bigint NOT NULL DEFAULT 0 COMMENT '审批人ID',
  `approver_name` varchar(64) NOT NULL DEFAULT '' COMMENT '审批人姓名',
  `scheduled_time` datetime DEFAULT NULL COMMENT '计划发布时间',
  `start_time` datetime DEFAULT NULL COMMENT '实际开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '实际完成时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_project_status` (`project_id`, `status`),
  KEY `idx_target_env` (`target_env`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Titan发布单与合规卡点表';

-- 预置示例发布单种子数据（幂等）
INSERT IGNORE INTO `titan_release_order` (
  `id`, `order_no`, `project_id`, `title`, `description`, `target_env`,
  `services_json`, `status`, `itsm_process_inst_id`, `applicant_id`, `applicant_name`,
  `approver_id`, `approver_name`, `scheduled_time`, `create_time`, `update_time`
) VALUES (
  1, 'RO202609200001', 1, '2026-09 核心金融微服务版本发布单', '包含支付结算与网关服务月度例行功能迭代发布', 'prod',
  '[{"appId": 1, "appName": "payment-service", "version": "v2.6.0", "gitCommit": "a1b2c3d4", "branch": "release/2.6.0"}, {"appId": 2, "appName": "account-center", "version": "v1.9.4", "gitCommit": "e5f6g7h8", "branch": "release/1.9.4"}]',
  'PENDING_APPROVAL', 101, 1, '系统超级管理员', 1, '审批负责人',
  DATE_ADD(NOW(), INTERVAL 2 HOUR), NOW(), NOW()
);
