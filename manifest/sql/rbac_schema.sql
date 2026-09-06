CREATE TABLE `sys_dept` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `parent_id` bigint NOT NULL DEFAULT 0,
    `ancestors` varchar(500) NOT NULL DEFAULT '',
    `dept_name` varchar(50) NOT NULL,
    `sort` int NOT NULL DEFAULT 0,
    `leader` varchar(50) NOT NULL DEFAULT '',
    `phone` varchar(20) NOT NULL DEFAULT '',
    `status` tinyint NOT NULL DEFAULT 1,
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_user` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `dept_id` bigint NOT NULL DEFAULT 0,
    `username` varchar(50) NOT NULL,
    `password` varchar(100) NOT NULL,
    `real_name` varchar(50) NOT NULL DEFAULT '',
    `mobile` varchar(20) NOT NULL DEFAULT '',
    `email` varchar(100) NOT NULL DEFAULT '',
    `avatar` varchar(255) NOT NULL DEFAULT '',
    `status` tinyint NOT NULL DEFAULT 1,
    `token_version` int NOT NULL DEFAULT 1,
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_username` (`username`),
    KEY `idx_dept_id` (`dept_id`),
    KEY `idx_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_role` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `name` varchar(50) NOT NULL,
    `code` varchar(50) NOT NULL,
    `sort` int NOT NULL DEFAULT 0,
    `data_scope` tinyint NOT NULL DEFAULT 1,
    `status` tinyint NOT NULL DEFAULT 1,
    `description` varchar(255) NOT NULL DEFAULT '',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_menu` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `parent_id` bigint NOT NULL DEFAULT 0,
    `title` varchar(50) NOT NULL,
    `type` tinyint NOT NULL,
    `path` varchar(200) NOT NULL DEFAULT '',
    `component` varchar(255) NOT NULL DEFAULT '',
    `permission_code` varchar(100) NOT NULL DEFAULT '',
    `icon` varchar(100) NOT NULL DEFAULT '',
    `sort` int NOT NULL DEFAULT 0,
    `visible` tinyint NOT NULL DEFAULT 1,
    `status` tinyint NOT NULL DEFAULT 1,
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_api` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `api_group` varchar(50) NOT NULL,
    `title` varchar(100) NOT NULL,
    `path` varchar(200) NOT NULL,
    `method` varchar(10) NOT NULL,
    `is_auto_sync` tinyint NOT NULL DEFAULT 1,
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_path_method` (`path`, `method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_menu_api` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `menu_id` bigint NOT NULL,
    `api_id` bigint NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_menu_api` (`menu_id`, `api_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_user_role` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint NOT NULL,
    `role_id` bigint NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_user_role` (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_role_menu` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `role_id` bigint NOT NULL,
    `menu_id` bigint NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_role_menu` (`role_id`, `menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_role_api` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `role_id` bigint NOT NULL,
    `api_id` bigint NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_role_api` (`role_id`, `api_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_dict_type` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `dict_name` varchar(100) NOT NULL,
    `dict_type` varchar(100) NOT NULL,
    `status` tinyint NOT NULL DEFAULT 1,
    `remark` varchar(500) NOT NULL DEFAULT '',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_dict_type` (`dict_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_dict_data` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `dict_type` varchar(100) NOT NULL,
    `dict_label` varchar(100) NOT NULL,
    `dict_value` varchar(100) NOT NULL,
    `dict_sort` int NOT NULL DEFAULT 0,
    `list_class` varchar(100) NOT NULL DEFAULT '',
    `is_default` tinyint NOT NULL DEFAULT 0,
    `status` tinyint NOT NULL DEFAULT 1,
    `remark` varchar(500) NOT NULL DEFAULT '',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_dict_type` (`dict_type`),
    UNIQUE KEY `idx_type_value` (`dict_type`, `dict_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_oper_log` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `title` varchar(100) NOT NULL DEFAULT '',
    `oper_name` varchar(50) NOT NULL DEFAULT '',
    `oper_url` varchar(200) NOT NULL DEFAULT '',
    `oper_method` varchar(10) NOT NULL DEFAULT '',
    `oper_ip` varchar(50) NOT NULL DEFAULT '',
    `status` tinyint NOT NULL DEFAULT 1,
    `error_msg` varchar(500) NOT NULL DEFAULT '',
    `cost_time` bigint NOT NULL DEFAULT 0,
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_oper_name` (`oper_name`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_login_log` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `username` varchar(50) NOT NULL DEFAULT '',
    `login_ip` varchar(50) NOT NULL DEFAULT '',
    `browser` varchar(50) NOT NULL DEFAULT '',
    `os` varchar(50) NOT NULL DEFAULT '',
    `status` tinyint NOT NULL DEFAULT 1,
    `msg` varchar(255) NOT NULL DEFAULT '',
    `login_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_username` (`username`),
    KEY `idx_login_time` (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;