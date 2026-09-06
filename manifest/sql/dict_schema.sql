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
