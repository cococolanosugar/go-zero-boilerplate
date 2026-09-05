CREATE TABLE `user` (
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
