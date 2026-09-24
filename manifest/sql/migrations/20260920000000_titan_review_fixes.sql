-- Titan 评审整改：唯一约束、审计列、状态词汇统一与双引导路径种子补齐
-- 背景：doc/reports/2026-09-19-titan-system-review.md P1 数据层问题

-- 1. titan_integration.name 唯一约束：防止同名集成凭证重复创建
ALTER TABLE `titan_integration` ADD UNIQUE KEY `uk_name` (`name`);

-- 2. titan_pipeline_step_exec 补 update_time：审批与状态变更的可审计时间
ALTER TABLE `titan_pipeline_step_exec`
  ADD COLUMN `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `create_time`;

-- 3. 集群状态词汇统一为 HEALTHY（与表默认值 'HEALTHY' 对齐，消除 ACTIVE/HEALTHY 双口径）
UPDATE `titan_cluster` SET `status` = 'HEALTHY' WHERE `status` = 'ACTIVE';

-- 4. 环境状态值域修正：物理删除模型下不存在 DELETED 态
ALTER TABLE `titan_env`
  MODIFY COLUMN `status` varchar(32) NOT NULL DEFAULT 'ACTIVE' COMMENT '环境状态: ACTIVE-启用 INACTIVE-停用';

-- 5. 绑定状态值域补 DEPLOYING：部署幂等中间态（部署锁）
ALTER TABLE `titan_env_app_binding`
  MODIFY COLUMN `status` varchar(32) NOT NULL DEFAULT 'PENDING' COMMENT '绑定状态: PENDING-待部署 DEPLOYING-部署中 RUNNING-运行中 FAILED-部署失败 STOPPED-已停止';

-- 6. 种子补齐：使 migration-only 引导路径与 init.sql 演示数据对齐（幂等，
--    init.sql 已包含以下数据时 INSERT IGNORE 静默跳过；Zadig 五表种子见 20260919000000）
INSERT IGNORE INTO `titan_cluster` (`id`, `name`, `env`, `api_endpoint`, `kubeconfig`, `status`, `version`, `description`, `created_by`)
VALUES
  (1, 'k8s-local-dev', 'dev', 'https://kubernetes.docker.internal:6443', 'apiVersion: v1\nclusters: []\n', 'HEALTHY', 'v1.30.2', '本地 Kubernetes 联调集群', 1),
  (2, 'k8s-staging-cluster', 'staging', 'https://k8s.staging.company.internal:6443', 'apiVersion: v1\nclusters: []\n', 'HEALTHY', 'v1.28.8', '预发验证环境混合集群', 1),
  (3, 'k8s-prod-primary', 'prod', 'https://k8s.prod.company.internal:6443', 'apiVersion: v1\nclusters: []\n', 'HEALTHY', 'v1.28.8', '生产环境多可用区高可用集群', 1);

INSERT IGNORE INTO `titan_integration` (`id`, `name`, `category`, `auth_type`, `config`, `status`, `description`, `created_by`)
VALUES
  (1, '企业核心 GitLab', 'git', 'token', '{"url": "https://gitlab.company.internal", "token": "glpat-sample-token"}', 1, '企业研发团队核心代码托管', 1),
  (2, '生产 Harbor 镜像仓库', 'harbor', 'token', '{"url": "https://harbor.company.internal", "username": "robot-ci", "token": "sample-pwd"}', 1, '业务容器镜像统一推送与存储', 1),
  (3, '企业构建 Jenkins 集群', 'jenkins', 'token', '{"url": "http://jenkins.company.internal:8080", "username": "admin", "token": "11a2b3c4d5"}', 1, '存量构建任务与物理机资源池', 1),
  (4, '集群默认 Nacos 服务注册与配置中心', 'nacos', 'none', '{"serverAddr": "127.0.0.1:8848", "namespace": "public", "group": "DEFAULT_GROUP", "contextPath": "/nacos"}', 1, 'go-zero 微服务集群统一服务注册与动态配置中心 (Alibaba Nacos)', 1),
  (5, '企业级 Apollo 分布式配置中心', 'apollo', 'token', '{"portalUrl": "http://127.0.0.1:8070", "metaServer": "http://127.0.0.1:8080", "appId": "go-zero-boilerplate", "cluster": "default", "env": "DEV", "token": "apollo-dev-secret-token"}', 1, '多环境动态参数热发布配置中心 (Ctrip Apollo)', 1);

INSERT IGNORE INTO `titan_pipeline` (`id`, `name`, `display_name`, `category`, `git_repo`, `git_branch`, `stages`, `params`, `triggers`, `status`, `description`, `created_by`)
VALUES
  (1, 'go-zero-boilerplate-ci', 'Go 微服务全链路发布流水线', 'microservice', 'https://github.com/cococolanosugar/go-zero-boilerplate.git', 'master',
  '[{"id":"build","name":"构建阶段","steps":[{"id":"checkout","name":"Git 源码检出","type":"CHECKOUT","params":{"depth":1}},{"id":"build","name":"Docker 镜像制作","type":"BUILD","params":{"image":"registry.internal/app:v1.0"}}]},{"id":"gate","name":"质量门禁","steps":[{"id":"approval","name":"生产上线审批","type":"APPROVAL","params":{"timeoutSeconds":86400}}]},{"id":"deploy","name":"集群部署","steps":[{"id":"helm","name":"Helm 3 幂等升级","type":"HELM_DEPLOY","params":{"clusterId":1,"namespace":"prod"}}]}]',
  '[{"name":"ENV","defaultValue":"prod","description":"发布目标环境"}]',
  '{"branch":"master","event":"push"}', 1, '微服务大仓核心自动化集成与 Helm 多集群交付中枢', 1),
  (2, 'frontend-portal-ci', '全栈多端门户发布流水线', 'frontend', 'https://github.com/cococolanosugar/go-zero-boilerplate.git', 'main',
  '[{"id":"build","name":"静态构建","steps":[{"id":"npm_build","name":"Vite 生产打包","type":"SHELL","params":{"command":"pnpm build"}}]},{"id":"deploy","name":"容器分发","steps":[{"id":"k8s_deploy","name":"K8s 原生 YAML SSA 发布","type":"K8S_DEPLOY","params":{"clusterId":1,"namespace":"default"}}]}]',
  '[]', '{}', 1, 'React 18 + Vite 前端多端自动化构建与发布', 1);

INSERT IGNORE INTO `titan_pipeline_exec` (`id`, `pipeline_id`, `pipeline_name`, `exec_no`, `trigger_type`, `trigger_by`, `git_branch`, `git_commit`, `runtime_params`, `status`, `workflow_id`, `start_time`, `end_time`, `duration_ms`, `artifacts`)
VALUES
  (1, 1, 'go-zero-boilerplate-ci', 'EXEC-20260918-001', 'MANUAL', 1, 'master', '3115943a', '{"ENV":"prod"}', 'SUCCESS', 'titan-exec-1', NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 55 MINUTE, 300000, '[{"name":"docker-image","path":"registry.internal/app:v1.0"}]'),
  (2, 1, 'go-zero-boilerplate-ci', 'EXEC-20260918-002', 'MANUAL', 1, 'feat/devops', 'fed7926b', '{"ENV":"dev"}', 'RUNNING', 'titan-exec-2', NOW() - INTERVAL 5 MINUTE, NULL, 0, '[]');
