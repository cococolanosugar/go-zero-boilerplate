-- 为 sys_portal_nav 表增加 env 环境/分组字段与索引
ALTER TABLE `sys_portal_nav` 
  ADD COLUMN `env` varchar(32) NOT NULL DEFAULT 'common' COMMENT '部署环境/分组: common(通用), prod(生产), pre(预发), test(测试), dev(开发)' AFTER `category`,
  ADD KEY `idx_env_status_sort` (`env`, `status`, `sort`);

-- 更新既有示例数据的环境归属
UPDATE `sys_portal_nav` SET `env` = 'dev' WHERE `id` IN (1, 2, 4);   -- 本地/开发支撑 (Temporal, Nacos, Swagger)
UPDATE `sys_portal_nav` SET `env` = 'common' WHERE `id` IN (3, 5, 6); -- 通用全局 (Casdoor, Admin, Portal)

-- 插入典型的多环境示范数据 (Prod 与 Test 场景)
INSERT IGNORE INTO `sys_portal_nav` (`id`, `title`, `category`, `env`, `url`, `icon`, `description`, `tags`, `sort`, `target`, `status`)
VALUES
  (7, 'Nacos 生产配置中心 (Prod)', '服务治理', 'prod', 'https://nacos.prod.example.com', 'SafetyCertificateOutlined', '生产微服务配置热更新与核心注册心跳高可用集群', 'Nacos,Prod,HA', 95, '_blank', 1),
  (8, 'Temporal 任务中心 (Test)', '任务引擎', 'test', 'http://temporal.test.example.com:8233', 'CloudServerOutlined', '测试环境分布式异步编排与 Saga 联调控制台', 'Temporal,Test,Workflow', 85, '_blank', 1),
  (9, 'Prometheus 生产监控 (Prod)', '监控运维', 'prod', 'https://prometheus.prod.example.com', 'FundProjectionScreenOutlined', '生产微服务指标采集、报警看板与运行态监控大盘', 'Monitor,Prometheus,Alert', 75, '_blank', 1);
