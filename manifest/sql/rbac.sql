-- ====================================================================
-- 企业级 RBAC、按钮资源与数据权限数据表结构与初始种子数据
-- ====================================================================
USE `go_zero_boilerplate`;

-- 1. 组织机构 / 部门表
CREATE TABLE IF NOT EXISTS `sys_dept` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '部门ID',
    `parent_id` bigint NOT NULL DEFAULT 0 COMMENT '父部门ID (0为顶级)',
    `ancestors` varchar(500) NOT NULL DEFAULT '' COMMENT '祖级列表 (如: 0,1,5)',
    `dept_name` varchar(50) NOT NULL COMMENT '部门名称',
    `sort` int NOT NULL DEFAULT 0 COMMENT '显示顺序',
    `leader` varchar(50) NOT NULL DEFAULT '' COMMENT '负责人',
    `phone` varchar(20) NOT NULL DEFAULT '' COMMENT '联系电话',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态 (1:正常 0:停用)',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组织机构部门表';

-- 2. 管理后台员工表 (区分于前台 C 端用户)
CREATE TABLE IF NOT EXISTS `sys_user` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '员工ID',
    `dept_id` bigint NOT NULL DEFAULT 0 COMMENT '归属部门ID',
    `username` varchar(50) NOT NULL COMMENT '登录账号',
    `password` varchar(100) NOT NULL COMMENT '密码哈希 (Bcrypt)',
    `real_name` varchar(50) NOT NULL DEFAULT '' COMMENT '真实姓名',
    `mobile` varchar(20) NOT NULL DEFAULT '' COMMENT '手机号码',
    `email` varchar(100) NOT NULL DEFAULT '' COMMENT '用户邮箱',
    `avatar` varchar(255) NOT NULL DEFAULT '' COMMENT '用户头像',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '账号状态 (1:正常 0:停用)',
    `token_version` int NOT NULL DEFAULT 1 COMMENT 'Token版本号 (用于强制下线)',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_username` (`username`),
    KEY `idx_dept_id` (`dept_id`),
    KEY `idx_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理后台系统用户表';

-- 3. 系统角色表
CREATE TABLE IF NOT EXISTS `sys_role` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '角色ID',
    `name` varchar(50) NOT NULL COMMENT '角色名称',
    `code` varchar(50) NOT NULL COMMENT '角色标识',
    `sort` int NOT NULL DEFAULT 0 COMMENT '显示顺序',
    `data_scope` tinyint NOT NULL DEFAULT 1 COMMENT '数据范围 (1:全部 2:自定义部门 3:本部门 4:本部门及以下 5:仅本人)',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态 (1:正常 0:停用)',
    `description` varchar(255) NOT NULL DEFAULT '' COMMENT '备注描述',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统角色表';

-- 4. 菜单与按钮权限项字典表
CREATE TABLE IF NOT EXISTS `sys_menu` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '菜单/权限ID',
    `parent_id` bigint NOT NULL DEFAULT 0 COMMENT '父级ID (0为根目录)',
    `title` varchar(50) NOT NULL COMMENT '标题名称',
    `type` tinyint NOT NULL COMMENT '类型 (1:目录 2:菜单 3:按钮/权限点)',
    `path` varchar(200) NOT NULL DEFAULT '' COMMENT '前端路由地址',
    `component` varchar(255) NOT NULL DEFAULT '' COMMENT '前端组件路径',
    `permission_code` varchar(100) NOT NULL DEFAULT '' COMMENT '权限标识符 (按钮节点核心)',
    `icon` varchar(100) NOT NULL DEFAULT '' COMMENT '图标标识',
    `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
    `visible` tinyint NOT NULL DEFAULT 1 COMMENT '菜单是否显示 (1:显示 0:隐藏)',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态 (1:正常 0:停用)',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统菜单与按钮权限表';

-- 5. API 资源表
CREATE TABLE IF NOT EXISTS `sys_api` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '接口ID',
    `api_group` varchar(50) NOT NULL COMMENT '所属业务域',
    `title` varchar(100) NOT NULL COMMENT '接口名称描述',
    `path` varchar(200) NOT NULL COMMENT '网关路由',
    `method` varchar(10) NOT NULL COMMENT '请求方式 (GET, POST, PUT, DELETE)',
    `is_auto_sync` tinyint NOT NULL DEFAULT 1 COMMENT '是否契约自动同步生成',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_path_method` (`path`, `method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网关后端接口资源表';

-- 6. 菜单/按钮与后端 API 绑定表
CREATE TABLE IF NOT EXISTS `sys_menu_api` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `menu_id` bigint NOT NULL COMMENT '菜单/按钮ID',
    `api_id` bigint NOT NULL COMMENT '接口ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_menu_api` (`menu_id`, `api_id`),
    KEY `idx_api_id` (`api_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单按钮与后端API接口绑定表';

-- 7. 关联关系表
CREATE TABLE IF NOT EXISTS `sys_user_role` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `role_id` bigint NOT NULL COMMENT '角色ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_user_role` (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

CREATE TABLE IF NOT EXISTS `sys_role_menu` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `role_id` bigint NOT NULL COMMENT '角色ID',
    `menu_id` bigint NOT NULL COMMENT '菜单/按钮ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_role_menu` (`role_id`, `menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色与菜单按钮关联表';

CREATE TABLE IF NOT EXISTS `sys_role_api` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `role_id` bigint NOT NULL COMMENT '角色ID',
    `api_id` bigint NOT NULL COMMENT '接口ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_role_api` (`role_id`, `api_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色与API权限关联表';

CREATE TABLE IF NOT EXISTS `sys_role_dept` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `role_id` bigint NOT NULL COMMENT '角色ID',
    `dept_id` bigint NOT NULL COMMENT '部门ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_role_dept` (`role_id`, `dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色自定义数据范围部门关联表';

-- ====================================================================
-- 初始基础数据种子 (Default Seeds)
-- ====================================================================

-- 顶级部门
INSERT INTO `sys_dept` (`id`, `parent_id`, `ancestors`, `dept_name`, `sort`, `leader`, `phone`, `status`)
VALUES (1, 0, '0', '总公司 / 研发中心', 1, 'CTO', '13800000000', 1)
ON DUPLICATE KEY UPDATE `dept_name` = VALUES(`dept_name`);

-- 初始超管用户 (账号: admin, 手机: 13800000000, 密码默认 123456 bcrypt 哈希)
INSERT INTO `sys_user` (`id`, `dept_id`, `username`, `password`, `real_name`, `mobile`, `email`, `avatar`, `status`, `token_version`)
VALUES (1, 1, 'admin', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/q7R905e1/1H7eZtTpm0F84lW1e5e', '超级管理员', '13800000000', 'admin@zero.dev', 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg', 1, 1)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- 初始超级管理员角色
INSERT INTO `sys_role` (`id`, `name`, `code`, `sort`, `data_scope`, `status`, `description`)
VALUES (1, '超级管理员', 'ROLE_ADMIN', 1, 1, 1, '拥有最高全权管理权限，不受任何限制')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `sys_role` (`id`, `name`, `code`, `sort`, `data_scope`, `status`, `description`)
VALUES (2, '运维主管', 'ROLE_OPERATOR', 2, 3, 1, '本部门订单与系统运维查看权限')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 绑定超管用户与超管角色
INSERT INTO `sys_user_role` (`id`, `user_id`, `role_id`)
VALUES (1, 1, 1)
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`);

-- 菜单与按钮权限初始化
-- 1. 监控大盘
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (1, 0, '监控大盘', 2, '/dashboard', 'Dashboard', 'dashboard:view', 'DashboardOutlined', 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 2. 订单管理模块与按钮
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (2, 0, '订单管理', 2, '/orders', 'Orders', 'order:view', 'ShoppingCartOutlined', 2)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (201, 2, '订单查询', 3, '', '', 'order:query', '', 1),
       (202, 2, '订单核验', 3, '', '', 'order:audit', '', 2),
       (203, 2, '订单导出', 3, '', '', 'order:export', '', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 3. 系统权限管理目录
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (3, 0, '系统权限', 1, '/system', '', 'system:dir', 'SettingOutlined', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 3.1 员工管理及按钮
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (31, 3, '员工管理', 2, '/system/users', 'System/Users', 'system:user:view', 'UserOutlined', 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (311, 31, '新增员工', 3, '', '', 'system:user:add', '', 1),
       (312, 31, '编辑员工', 3, '', '', 'system:user:edit', '', 2),
       (313, 31, '删除员工', 3, '', '', 'system:user:delete', '', 3),
       (314, 31, '分配角色', 3, '', '', 'system:user:assign', '', 4)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 3.2 角色管理及按钮
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (32, 3, '角色权限', 2, '/system/roles', 'System/Roles', 'system:role:view', 'SafetyCertificateOutlined', 2)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (321, 32, '新增角色', 3, '', '', 'system:role:add', '', 1),
       (322, 32, '分配权限', 3, '', '', 'system:role:assign', '', 2),
       (323, 32, '删除角色', 3, '', '', 'system:role:delete', '', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 3.3 菜单与按钮管理
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (33, 3, '菜单管理', 2, '/system/menus', 'System/Menus', 'system:menu:view', 'MenuOutlined', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (331, 33, '新增菜单', 3, '', '', 'system:menu:add', '', 1),
       (332, 33, '编辑菜单', 3, '', '', 'system:menu:edit', '', 2),
       (333, 33, '删除菜单', 3, '', '', 'system:menu:delete', '', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 3.4 API 资源字典
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (34, 3, '接口字典', 2, '/system/apis', 'System/Apis', 'system:api:view', 'ApiOutlined', 4)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 3.5 个人中心
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (4, 0, '个人中心', 2, '/users', 'Users', 'user:profile:view', 'UserOutlined', 4)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 基础 API 资源登记
INSERT INTO `sys_api` (`id`, `api_group`, `title`, `path`, `method`)
VALUES (1, 'user', '获取当前用户信息', '/api/v1/user/info', 'GET'),
       (2, 'order', '获取大盘概览', '/api/v1/order/dashboard', 'GET'),
       (3, 'order', '获取订单详情', '/api/v1/order/detail', 'GET'),
       (4, 'system', '获取个人菜单与权限', '/api/v1/system/personal/permissions', 'GET'),
       (5, 'system', '员工列表', '/api/v1/system/users', 'GET'),
       (6, 'system', '创建员工', '/api/v1/system/users', 'POST'),
       (7, 'system', '角色列表', '/api/v1/system/roles', 'GET'),
       (8, 'system', '角色授权', '/api/v1/system/roles/permissions', 'POST'),
       (9, 'system', '菜单树查询', '/api/v1/system/menus', 'GET'),
       (10, 'system', '接口字典查询', '/api/v1/system/apis', 'GET')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 按钮与 API 初始绑定 (一石二鸟联动)
INSERT INTO `sys_menu_api` (`menu_id`, `api_id`)
VALUES (1, 2),   -- 监控大盘 -> /api/v1/order/dashboard
       (201, 3), -- 订单查询 -> /api/v1/order/detail
       (31, 5),  -- 员工管理 -> /api/v1/system/users GET
       (311, 6), -- 新增员工 -> /api/v1/system/users POST
       (32, 7),  -- 角色权限 -> /api/v1/system/roles GET
       (322, 8), -- 分配权限 -> /api/v1/system/roles/permissions POST
       (33, 9),  -- 菜单管理 -> /api/v1/system/menus GET
       (34, 10), -- 接口字典 -> /api/v1/system/apis GET
       (4, 1)    -- 个人中心 -> /api/v1/user/info GET
ON DUPLICATE KEY UPDATE `api_id` = VALUES(`api_id`);