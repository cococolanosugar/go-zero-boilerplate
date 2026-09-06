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
