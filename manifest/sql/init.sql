-- 初始化数据库与表结构
CREATE DATABASE IF NOT EXISTS `go_zero_boilerplate` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `casdoor` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `go_zero_boilerplate`;

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `mobile` varchar(20) NOT NULL DEFAULT '' COMMENT '手机号',
    `username` varchar(50) NOT NULL DEFAULT '' COMMENT '用户昵称',
    `password` varchar(100) NOT NULL DEFAULT '' COMMENT '密码哈希',
    `avatar` varchar(255) NOT NULL DEFAULT '' COMMENT '用户头像',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 订单表
-- 初始基础数据种子
-- 用户密码默认 123456 (使用 bcrypt 哈希值)
INSERT INTO `user` (`id`, `mobile`, `username`, `password`, `avatar`) 
VALUES (1, '13800000000', 'Antigravity Admin', '$2a$10$Ng7owCC4Isoz4SlkX553jOuRn0dmxrNS2CIX8p/JGBwx2bCHFHHdC', 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg')
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);


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

-- 8. 字典类型表
CREATE TABLE IF NOT EXISTS `sys_dict_type` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '字典类型ID',
    `dict_name` varchar(100) NOT NULL COMMENT '字典名称',
    `dict_type` varchar(100) NOT NULL COMMENT '字典类型标识',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态 (1:正常 0:停用)',
    `remark` varchar(500) NOT NULL DEFAULT '' COMMENT '备注说明',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_dict_type` (`dict_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统数据字典类型表';

-- 9. 字典数据项表
CREATE TABLE IF NOT EXISTS `sys_dict_data` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '字典编码ID',
    `dict_type` varchar(100) NOT NULL COMMENT '字典类型标识',
    `dict_label` varchar(100) NOT NULL COMMENT '字典标签',
    `dict_value` varchar(100) NOT NULL COMMENT '字典键值',
    `dict_sort` int NOT NULL DEFAULT 0 COMMENT '显示排序',
    `list_class` varchar(100) NOT NULL DEFAULT '' COMMENT '表格回显样式(badge/tag)',
    `is_default` tinyint NOT NULL DEFAULT 0 COMMENT '是否默认 (1:是 0:否)',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态 (1:正常 0:停用)',
    `remark` varchar(500) NOT NULL DEFAULT '' COMMENT '备注说明',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_dict_type` (`dict_type`),
    UNIQUE KEY `idx_type_value` (`dict_type`, `dict_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统数据字典数据项表';

-- 10. 系统操作日志表
CREATE TABLE IF NOT EXISTS `sys_oper_log` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志主键',
    `title` varchar(100) NOT NULL DEFAULT '' COMMENT '操作模块/接口描述',
    `oper_name` varchar(50) NOT NULL DEFAULT '' COMMENT '操作员工账号',
    `oper_url` varchar(200) NOT NULL DEFAULT '' COMMENT '请求URL',
    `oper_method` varchar(10) NOT NULL DEFAULT '' COMMENT '请求方法',
    `oper_ip` varchar(50) NOT NULL DEFAULT '' COMMENT '操作IP地址',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '操作状态 (1:正常 0:异常)',
    `error_msg` varchar(500) NOT NULL DEFAULT '' COMMENT '错误消息',
    `cost_time` bigint NOT NULL DEFAULT 0 COMMENT '消耗时间(毫秒)',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    KEY `idx_oper_name` (`oper_name`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统操作日志表';

-- 11. 系统登录日志表
CREATE TABLE IF NOT EXISTS `sys_login_log` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '访问ID',
    `username` varchar(50) NOT NULL DEFAULT '' COMMENT '登录账号',
    `login_ip` varchar(50) NOT NULL DEFAULT '' COMMENT '登录IP地址',
    `browser` varchar(50) NOT NULL DEFAULT '' COMMENT '浏览器类型',
    `os` varchar(50) NOT NULL DEFAULT '' COMMENT '操作系统',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '登录状态 (1:成功 0:失败)',
    `msg` varchar(255) NOT NULL DEFAULT '' COMMENT '提示消息',
    `login_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
    PRIMARY KEY (`id`),
    KEY `idx_username` (`username`),
    KEY `idx_login_time` (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统登录日志表';

-- ====================================================================
-- 初始基础数据种子 (Default Seeds)
-- ====================================================================

-- 顶级部门
INSERT INTO `sys_dept` (`id`, `parent_id`, `ancestors`, `dept_name`, `sort`, `leader`, `phone`, `status`)
VALUES (1, 0, '0', '总公司 / 研发中心', 1, 'CTO', '13800000000', 1)
ON DUPLICATE KEY UPDATE `dept_name` = VALUES(`dept_name`);

-- 初始超管用户 (账号: admin, 手机: 13800000000, 密码默认 123456 bcrypt 哈希)
INSERT INTO `sys_user` (`id`, `dept_id`, `username`, `password`, `real_name`, `mobile`, `email`, `avatar`, `status`, `token_version`)
VALUES (1, 1, 'admin', '$2a$10$Ng7owCC4Isoz4SlkX553jOuRn0dmxrNS2CIX8p/JGBwx2bCHFHHdC', '超级管理员', '13800000000', 'admin@zero.dev', 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg', 1, 1)
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

-- 2. 组织管理目录 (Org 组织架构 - 人·岗·部 实体闭环)
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (7, 0, '组织管理', 1, '/org', '', 'org:dir', 'ApartmentOutlined', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `path` = VALUES(`path`), `icon` = VALUES(`icon`), `sort` = VALUES(`sort`);

-- 3.1 员工管理及按钮
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (31, 7, '员工管理', 2, '/org/users', 'System/Users', 'system:user:view', 'UserOutlined', 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `parent_id` = VALUES(`parent_id`), `path` = VALUES(`path`), `sort` = VALUES(`sort`);

INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (311, 31, '新增员工', 3, '', '', 'system:user:add', '', 1),
       (312, 31, '编辑员工', 3, '', '', 'system:user:edit', '', 2),
       (313, 31, '删除员工', 3, '', '', 'system:user:delete', '', 3),
       (314, 31, '分配角色', 3, '', '', 'system:user:assign', '', 4)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 3.2 部门管理及岗位管理
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (37, 7, '部门管理', 2, '/org/dept', 'System/Dept', 'system:dept:view', 'ApartmentOutlined', 2),
       (38, 7, '岗位管理', 2, '/org/post', 'SysPost', 'system:post:view', 'IdcardOutlined', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `parent_id` = VALUES(`parent_id`), `path` = VALUES(`path`), `sort` = VALUES(`sort`);

-- 4. 权限管理目录 (IAM 访问控制策略层)
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (6, 0, '权限管理', 1, '/permission', '', 'permission:dir', 'SafetyCertificateOutlined', 4)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `path` = VALUES(`path`), `icon` = VALUES(`icon`), `sort` = VALUES(`sort`);

-- 4.1 角色管理及按钮
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (32, 6, '角色权限', 2, '/permission/roles', 'System/Roles', 'system:role:view', 'SafetyCertificateOutlined', 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `parent_id` = VALUES(`parent_id`), `path` = VALUES(`path`), `sort` = VALUES(`sort`);

INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (321, 32, '新增角色', 3, '', '', 'system:role:add', '', 1),
       (322, 32, '分配权限', 3, '', '', 'system:role:assign', '', 2),
       (323, 32, '删除角色', 3, '', '', 'system:role:delete', '', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 4.2 菜单与按钮管理
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (33, 6, '菜单管理', 2, '/permission/menus', 'System/Menus', 'system:menu:view', 'MenuOutlined', 2)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `parent_id` = VALUES(`parent_id`), `path` = VALUES(`path`), `sort` = VALUES(`sort`);

INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (331, 33, '新增菜单', 3, '', '', 'system:menu:add', '', 1),
       (332, 33, '编辑菜单', 3, '', '', 'system:menu:edit', '', 2),
       (333, 33, '删除菜单', 3, '', '', 'system:menu:delete', '', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 5. 通知公告独立一级路由
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (39, 0, '通知公告', 2, '/notice', 'SysNotice', 'system:notice:view', 'BellOutlined', 5)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `parent_id` = VALUES(`parent_id`), `path` = VALUES(`path`), `sort` = VALUES(`sort`);

-- 6. 系统配置管理目录
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (3, 0, '系统配置', 1, '/system', '', 'system:dir', 'SettingOutlined', 6)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `sort` = VALUES(`sort`);

-- 6.1 参数设置与字典管理
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (42, 3, '参数设置', 2, '/system/config', 'SysConfig', 'system:config:view', 'SettingOutlined', 1),
       (35, 3, '数据字典', 2, '/system/dicts', 'System/Dicts', 'system:dict:view', 'BookOutlined', 2),
       (34, 3, '接口字典', 2, '/system/apis', 'System/Apis', 'system:api:view', 'ApiOutlined', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `parent_id` = VALUES(`parent_id`), `sort` = VALUES(`sort`);

-- 6.2 数据字典管理及按钮
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (351, 35, '新增类型', 3, '', '', 'system:dict:type:add', '', 1),
       (352, 35, '编辑类型', 3, '', '', 'system:dict:type:edit', '', 2),
       (353, 35, '删除类型', 3, '', '', 'system:dict:type:delete', '', 3),
       (354, 35, '新增数据', 3, '', '', 'system:dict:data:add', '', 4),
       (355, 35, '编辑数据', 3, '', '', 'system:dict:data:edit', '', 5),
       (356, 35, '删除数据', 3, '', '', 'system:dict:data:delete', '', 6)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 7. 系统监控目录
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (5, 0, '系统监控', 1, '/monitor', '', 'monitor:dir', 'FundProjectionScreenOutlined', 7),
       (51, 5, '在线用户', 2, '/monitor/online', 'System/Online', 'system:online:view', 'TeamOutlined', 1),
       (52, 5, '审计日志', 2, '/monitor/logs', 'System/Logs', 'system:log:view', 'HistoryOutlined', 2),
       (53, 5, '接口文档', 2, '/monitor/openapi', 'System/OpenApi', 'system:openapi:view', 'FileTextOutlined', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `sort` = VALUES(`sort`);

-- 8. 个人中心
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (4, 0, '个人中心', 2, '/users', 'Users', 'user:profile:view', 'UserOutlined', 8)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `sort` = VALUES(`sort`);

-- 基础 API 资源登记
INSERT INTO `sys_api` (`id`, `api_group`, `title`, `path`, `method`)
VALUES (1, 'user', '获取当前用户信息', '/api/v1/user/info', 'GET'),
       (2, 'dashboard', '获取系统大盘概览', '/api/v1/dashboard/overview', 'GET'),
       (4, 'system', '获取个人菜单与权限', '/api/v1/system/personal/permissions', 'GET'),
       (5, 'system', '员工列表', '/api/v1/system/users', 'GET'),
       (6, 'system', '创建员工', '/api/v1/system/users', 'POST'),
       (7, 'system', '角色列表', '/api/v1/system/roles', 'GET'),
       (8, 'system', '角色授权', '/api/v1/system/roles/permissions', 'POST'),
       (9, 'system', '菜单树查询', '/api/v1/system/menus', 'GET'),
       (10, 'system', '接口字典查询', '/api/v1/system/apis', 'GET'),
       (11, 'dict', '获取字典类型列表', '/api/v1/system/dict/types', 'GET'),
       (12, 'dict', '创建字典类型', '/api/v1/system/dict/types', 'POST'),
       (13, 'dict', '更新字典类型', '/api/v1/system/dict/types', 'PUT'),
       (14, 'dict', '删除字典类型', '/api/v1/system/dict/types/:id', 'DELETE'),
       (15, 'dict', '获取字典数据项列表', '/api/v1/system/dict/data', 'GET'),
       (16, 'dict', '创建字典数据项', '/api/v1/system/dict/data', 'POST'),
       (17, 'dict', '更新字典数据项', '/api/v1/system/dict/data', 'PUT'),
       (18, 'dict', '删除字典数据项', '/api/v1/system/dict/data/:id', 'DELETE'),
       (19, 'dict', '根据类型查询字典项', '/api/v1/system/dict/data/type/:dictType', 'GET'),
       (20, 'system', '操作日志列表', '/api/v1/system/logs/oper', 'GET'),
       (21, 'system', '登录日志列表', '/api/v1/system/logs/login', 'GET')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 按钮与 API 初始绑定 (一石二鸟联动)
INSERT INTO `sys_menu_api` (`menu_id`, `api_id`)
VALUES (1, 2),   -- 监控大盘 -> /api/v1/dashboard/overview
       (31, 5),  -- 员工管理 -> /api/v1/system/users GET
       (311, 6), -- 新增员工 -> /api/v1/system/users POST
       (32, 7),  -- 角色权限 -> /api/v1/system/roles GET
       (322, 8), -- 分配权限 -> /api/v1/system/roles/permissions POST
       (33, 9),  -- 菜单管理 -> /api/v1/system/menus GET
       (34, 10), -- 接口字典 -> /api/v1/system/apis GET
       (35, 11), -- 数据字典 -> /api/v1/system/dict/types GET
       (35, 15), -- 数据字典 -> /api/v1/system/dict/data GET
       (35, 19), -- 数据字典 -> /api/v1/system/dict/data/type/:dictType GET
       (351, 12), -- 新增类型 -> /api/v1/system/dict/types POST
       (352, 13), -- 编辑类型 -> /api/v1/system/dict/types PUT
       (353, 14), -- 删除类型 -> /api/v1/system/dict/types/:id DELETE
       (354, 16), -- 新增数据 -> /api/v1/system/dict/data POST
       (355, 17), -- 编辑数据 -> /api/v1/system/dict/data PUT
       (356, 18), -- 删除数据 -> /api/v1/system/dict/data/:id DELETE
       (36, 20),  -- 审计日志 -> /api/v1/system/logs/oper GET
       (36, 21),  -- 审计日志 -> /api/v1/system/logs/login GET
       (361, 20), -- 操作日志查询 -> /api/v1/system/logs/oper GET
       (362, 21), -- 登录日志查询 -> /api/v1/system/logs/login GET
       (4, 1)    -- 个人中心 -> /api/v1/user/info GET
ON DUPLICATE KEY UPDATE `api_id` = VALUES(`api_id`);

-- 初始系统数据字典预置数据
INSERT INTO `sys_dict_type` (`id`, `dict_name`, `dict_type`, `status`, `remark`)
VALUES (1, '订单交易状态', 'order_status', 1, '商城的通用交易状态流转'),
       (2, '用户性别', 'sys_user_sex', 1, '性别字典列表'),
       (3, '系统通用状态', 'sys_common_status', 1, '启用/停用状态'),
       (4, '通知公告类型', 'sys_notice_type', 1, '通知公告分类')
ON DUPLICATE KEY UPDATE `dict_name` = VALUES(`dict_name`);

INSERT INTO `sys_dict_data` (`id`, `dict_type`, `dict_label`, `dict_value`, `dict_sort`, `list_class`, `is_default`, `status`, `remark`)
VALUES (1, 'order_status', '待支付', 'PENDING', 1, 'warning', 1, 1, '等待买家付款'),
       (2, 'order_status', '已支付', 'PAID', 2, 'success', 0, 1, '买家已付款'),
       (3, 'order_status', '已发货', 'SHIPPED', 3, 'processing', 0, 1, '商家已发货'),
       (4, 'order_status', '已完成', 'COMPLETED', 4, 'default', 0, 1, '订单正常完结'),
       (5, 'order_status', '已退款', 'REFUNDED', 5, 'error', 0, 1, '已原路退款'),
       (6, 'sys_user_sex', '男', '1', 1, 'blue', 1, 1, '男性'),
       (7, 'sys_user_sex', '女', '2', 2, 'magenta', 0, 1, '女性'),
       (8, 'sys_user_sex', '未知', '0', 3, 'default', 0, 1, '未指定性别'),
       (9, 'sys_common_status', '正常', '1', 1, 'success', 1, 1, '正常启用'),
       (10, 'sys_common_status', '停用', '0', 2, 'error', 0, 1, '停用禁用'),
       (11, 'sys_notice_type', '系统通知', '1', 1, 'processing', 1, 1, '系统重要通知'),
       (12, 'sys_notice_type', '运营公告', '2', 2, 'warning', 0, 1, '平台运营公告')
ON DUPLICATE KEY UPDATE `dict_label` = VALUES(`dict_label`);

-- ====================================================================
-- 12. 异步定时与工作流任务管理表 (sys_async_task)
-- ====================================================================
CREATE TABLE IF NOT EXISTS `sys_async_task` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `task_name` varchar(128) NOT NULL COMMENT '任务名称',
  `task_key` varchar(64) NOT NULL COMMENT '任务标识(唯一Key)',
  `task_type` varchar(32) NOT NULL DEFAULT 'CRON' COMMENT '任务类型（CRON/WORKFLOW）',
  `cron_expr` varchar(64) NOT NULL DEFAULT '' COMMENT 'Cron表达式',
  `workflow_type` varchar(128) NOT NULL DEFAULT 'OrderSagaWorkflow' COMMENT '关联Temporal工作流类型',
  `task_queue` varchar(64) NOT NULL DEFAULT 'ORDER_TASK_QUEUE' COMMENT 'Temporal任务队列',
  `payload` text NOT NULL COMMENT '任务默认入参JSON',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '任务状态（1正常 0暂停）',
  `last_run_time` datetime DEFAULT NULL COMMENT '最近一次运行时间',
  `last_run_status` varchar(32) NOT NULL DEFAULT 'IDLE' COMMENT '最近执行状态',
  `remark` varchar(500) DEFAULT '' COMMENT '备注说明',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_key` (`task_key`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异步定时与工作流任务管理表';

INSERT IGNORE INTO `sys_async_task` (`id`, `task_name`, `task_key`, `task_type`, `cron_expr`, `workflow_type`, `task_queue`, `payload`, `status`, `last_run_status`, `remark`)
VALUES 
  (1, 'HelloWorld 异步演示任务', 'hello_world_sample', 'CRON', '*/5 * * * *', 'HelloWorldWorkflow', 'ASYNC_TASK_QUEUE', '{"name":"Antigravity Gopher"}', 1, 'IDLE', '用于演示 Temporal 异步任务与工作流开发标准模式的示例任务'),
  (2, '系统每日报表统计', 'daily_report_generate', 'CRON', '0 2 * * *', 'DailyReportWorkflow', 'ASYNC_TASK_QUEUE', '{"scope":"all"}', 1, 'IDLE', '每日凌晨统计平台各项微服务核心指标并生成汇总报表');

-- ====================================================================
-- 13. 门户网址导航配置表 (sys_portal_nav)
-- ====================================================================
CREATE TABLE IF NOT EXISTS `sys_portal_nav` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(64) NOT NULL DEFAULT '' COMMENT '站点显示名称',
  `category` varchar(32) NOT NULL DEFAULT 'default' COMMENT '所属分类',
  `env` varchar(32) NOT NULL DEFAULT 'common' COMMENT '部署环境/分组: common(通用), prod(生产), pre(预发), test(测试), dev(开发)',
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
  KEY `idx_env_status_sort` (`env`, `status`, `sort`),
  KEY `idx_status_sort` (`status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门户网址导航站点数据源配置表';

INSERT IGNORE INTO `sys_portal_nav` (`id`, `title`, `category`, `env`, `url`, `icon`, `description`, `tags`, `sort`, `target`, `status`)
VALUES
  (1, 'Temporal Web 控制台', '任务引擎', 'dev', 'http://{HOST}:8233', 'CloudServerOutlined', '分布式工作流与异步任务编排执行可视化监控面板', 'Temporal,Saga,Cron', 100, '_blank', 1),
  (2, 'Nacos 服务注册与配置中心', '服务治理', 'dev', 'http://{HOST}:8848/nacos', 'SafetyCertificateOutlined', '微服务注册、健康心跳探测与动态配置下发管理控制台', 'Nacos,gRPC,Registry', 90, '_blank', 1),
  (3, 'Casdoor 统一身份认证中心', '身份认证', 'common', 'http://{HOST}:8000', 'KeyOutlined', '企业级 OAuth 2.0 / OIDC 单点登录与统一账号通行证管理中心', 'IAM,OIDC,SSO', 80, '_blank', 1),
  (4, '网关 Swagger / OpenAPI 文档', '开发文档', 'dev', 'http://{HOST}:8888/swagger', 'BookOutlined', '微服务统一网关对外暴露的全部 HTTP RESTful 接口契约与在线交互文档', 'BFF,RESTful,API', 70, '_blank', 1),
  (5, '企业管理后台 (Admin)', '核心门户', 'common', 'http://{HOST}:3001', 'DashboardOutlined', '基于 Ant Design Pro 规范构建的企业级中后台高密系统治理工作台', 'React,Admin,RBAC', 60, '_blank', 1),
  (6, '官方技术门户 (Portal)', '核心门户', 'common', 'http://{HOST}:3000', 'RocketOutlined', '面向全体开发者与客户的全栈技术门户、微服务全景与联调工作台', 'Portal,TopNav,Vite', 50, '_blank', 1),
  (7, '企业 IT 自助服务台', '核心门户', 'common', 'http://{HOST}:3000/desk', 'CustomerServiceOutlined', '面向全体企业员工的一站式服务目录大厅、自助提单与审批流转时间线跟踪', 'ITSM,BPMN,SLA', 45, '_self', 1),
  (8, 'BPMN 流程设计与工单治理中心', '核心门户', 'common', 'http://{HOST}:3001/itsm/tickets', 'AuditOutlined', '企业级 BPMN 2.0 流程模型可视化建模设计、服务目录发布与全量工单运维工作台', 'BPMN,Process,Admin', 40, '_blank', 1),
  (9, 'Titan 研发交付平台 (CI/CD)', '核心门户', 'common', 'http://{HOST}:3002', 'DeploymentUnitOutlined', '云原生持续交付、源码构建、镜像制作与 Kubernetes Helm/YAML 自动化发布引擎', 'DevOps,CI/CD,K8s,Helm,Jenkins', 38, '_blank', 1),
  (10, 'Nacos 生产配置中心 (Prod)', '服务治理', 'prod', 'https://nacos.prod.example.com', 'SafetyCertificateOutlined', '生产微服务配置热更新与核心注册心跳高可用集群', 'Nacos,Prod,HA', 95, '_blank', 1),
  (11, 'Temporal 任务中心 (Test)', '任务引擎', 'test', 'http://temporal.test.example.com:8233', 'CloudServerOutlined', '测试环境分布式异步编排与 Saga 联调控制台', 'Temporal,Test,Workflow', 85, '_blank', 1),
  (12, 'Prometheus 生产监控 (Prod)', '监控运维', 'prod', 'https://prometheus.prod.example.com', 'FundProjectionScreenOutlined', '生产微服务指标采集、报警看板与运行态监控大盘', 'Monitor,Prometheus,Alert', 75, '_blank', 1);

-- ====================================================================
-- 14. ITSM 服务管理与 BPMN 流程引擎数据表 (itsm_*)
-- ====================================================================
CREATE TABLE IF NOT EXISTS `itsm_process_def` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ITSM 流程定义表';

CREATE TABLE IF NOT EXISTS `itsm_process_inst` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ITSM 工单流程实例表';

CREATE TABLE IF NOT EXISTS `itsm_task` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ITSM 待办任务流转表';

CREATE TABLE IF NOT EXISTS `itsm_ticket_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inst_id` bigint NOT NULL DEFAULT 0,
  `form_data` json NOT NULL,
  `snapshot_schema` json DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inst_id` (`inst_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ITSM 动态表单数据表';

CREATE TABLE IF NOT EXISTS `itsm_task_log` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ITSM 工单流转审计日志表';

CREATE TABLE IF NOT EXISTS `itsm_sla_policy` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ITSM SLA 时效策略表';

-- 预置 SLA 策略
INSERT IGNORE INTO `itsm_sla_policy` (`id`, `priority`, `calendar_type`, `response_limit_min`, `resolve_limit_min`, `warn_threshold_pct`)
VALUES
  (1, 'P1', '24X7', 15, 120, 80),
  (2, 'P2', 'WORKING_HOURS', 30, 240, 80),
  (3, 'P3', 'WORKING_HOURS', 60, 480, 80),
  (4, 'P4', 'WORKING_HOURS', 120, 1440, 80);

-- 挂载管理后台菜单项：服务流程 (ITSM)
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`, `visible`, `status`)
VALUES
  (60, 0, '服务流程', 1, '/itsm', '', 'itsm:manage', 'BranchesOutlined', 4, 1, 1),
  (61, 60, '工单中心', 2, '/itsm/tickets', 'Itsm/Tickets', 'itsm:ticket:view', 'AuditOutlined', 1, 1, 1),
  (62, 60, '流程目录', 2, '/itsm/process-defs', 'Itsm/ProcessDefs', 'itsm:process-def:view', 'ApartmentOutlined', 2, 1, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- ====================================================================
-- 15. Titan 研发交付平台核心数据表 (titan_*)
-- ====================================================================

CREATE TABLE IF NOT EXISTS `titan_integration` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Titan 外部系统集成与凭据表';

CREATE TABLE IF NOT EXISTS `titan_cluster` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Titan Kubernetes 集群管理表';

CREATE TABLE IF NOT EXISTS `titan_pipeline` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Titan 流水线模型定义表';

CREATE TABLE IF NOT EXISTS `titan_pipeline_exec` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Titan 流水线执行实例表';

CREATE TABLE IF NOT EXISTS `titan_pipeline_step_exec` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Titan 流水线步骤执行记录表';

-- 挂载管理后台菜单项：Titan 研发交付平台
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`, `visible`, `status`)
VALUES
  (70, 0, '研发交付', 1, '/titan', '', 'titan:manage', 'DeploymentUnitOutlined', 5, 1, 1),
  (71, 70, '交付流水线', 2, '/titan/pipelines', 'Titan/Pipelines', 'titan:pipeline:view', 'PlayCircleOutlined', 1, 1, 1),
  (72, 70, '集群大盘', 2, '/titan/clusters', 'Titan/Clusters', 'titan:cluster:view', 'ClusterOutlined', 2, 1, 1),
  (73, 70, '集成管理', 2, '/titan/integrations', 'Titan/Integrations', 'titan:integration:view', 'ApiOutlined', 3, 1, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);