-- Create "sys_portal_nav" table
CREATE TABLE IF NOT EXISTS `sys_portal_nav` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(64) NOT NULL DEFAULT '' COMMENT '站点显示名称',
  `category` varchar(32) NOT NULL DEFAULT 'default' COMMENT '所属分类',
  `url` varchar(512) NOT NULL DEFAULT '' COMMENT '目标网址(支持 {HOST} 动态占位符)',
  `icon` varchar(255) NOT NULL DEFAULT '' COMMENT '图标(Antd图标名或图片URL)',
  `description` varchar(255) NOT NULL DEFAULT '' COMMENT '站点描述说明',
  `tags` varchar(128) NOT NULL DEFAULT '' COMMENT '站点标签(逗号分隔)',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序权重(越大越靠前)',
  `target` varchar(16) NOT NULL DEFAULT '_blank' COMMENT '打开方式(_blank/_self)',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态(1:启用 0:停用)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_status_sort` (`category`, `status`, `sort`),
  KEY `idx_status_sort` (`status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门户网址导航站点数据源配置表';

-- 插入默认企业基础设施与支撑平台导航数据
INSERT IGNORE INTO `sys_portal_nav` (`id`, `title`, `category`, `url`, `icon`, `description`, `tags`, `sort`, `target`, `status`)
VALUES
  (1, 'Temporal Web 控制台', '任务引擎', 'http://{HOST}:8233', 'CloudServerOutlined', '分布式工作流与异步任务编排执行可视化监控面板', 'Temporal,Saga,Cron', 100, '_blank', 1),
  (2, 'Nacos 服务注册与配置中心', '服务治理', 'http://{HOST}:8848/nacos', 'SafetyCertificateOutlined', '微服务注册、健康心跳探测与动态配置下发管理控制台', 'Nacos,gRPC,Registry', 90, '_blank', 1),
  (3, 'Casdoor 统一身份认证中心', '身份认证', 'http://{HOST}:8000', 'KeyOutlined', '企业级 OAuth 2.0 / OIDC 单点登录与统一账号通行证管理中心', 'IAM,OIDC,SSO', 80, '_blank', 1),
  (4, '网关 Swagger / OpenAPI 文档', '开发文档', 'http://{HOST}:8888/swagger', 'BookOutlined', '微服务统一网关对外暴露的全部 HTTP RESTful 接口契约与在线交互文档', 'BFF,RESTful,API', 70, '_blank', 1),
  (5, '企业管理后台 (Admin)', '核心门户', 'http://{HOST}:3001', 'DashboardOutlined', '基于 Ant Design Pro 规范构建的企业级中后台高密系统治理工作台', 'React,Admin,RBAC', 60, '_blank', 1),
  (6, '官方技术门户 (Portal)', '核心门户', 'http://{HOST}:3000', 'RocketOutlined', '面向全体开发者与客户的全栈技术门户、微服务全景与联调工作台', 'Portal,TopNav,Vite', 50, '_blank', 1);

-- 挂载管理后台菜单项：系统管理 -> 导航配置
-- 查找系统管理(id=3)下的子菜单，插入 导航配置 (id=38, parent_id=3)
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`, `visible`, `status`)
VALUES (38, 3, '导航配置', 2, '/system/navigation', 'System/Navigation', 'system:navigation:list', 'CompassOutlined', 8, 1, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `type` = VALUES(`type`), `path` = VALUES(`path`), `component` = VALUES(`component`);

-- 按钮级权限
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`, `visible`, `status`)
VALUES 
  (381, 38, '导航新增', 3, '', '', 'system:navigation:add', '', 1, 1, 1),
  (382, 38, '导航修改', 3, '', '', 'system:navigation:edit', '', 2, 1, 1),
  (383, 38, '导航删除', 3, '', '', 'system:navigation:delete', '', 3, 1, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `type` = VALUES(`type`), `permission_code` = VALUES(`permission_code`);
