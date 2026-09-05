-- 初始化数据库与表结构
CREATE DATABASE IF NOT EXISTS `go_zero_boilerplate` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
CREATE TABLE IF NOT EXISTS `orders` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `order_id` bigint NOT NULL DEFAULT 0 COMMENT '业务订单号',
    `user_id` bigint NOT NULL DEFAULT 0 COMMENT '用户ID',
    `item` varchar(100) NOT NULL DEFAULT '' COMMENT '购买商品',
    `amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '订单金额',
    `status` varchar(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_order_id` (`order_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 初始基础数据种子
-- 用户密码默认 123456 (使用 bcrypt 哈希值)
INSERT INTO `user` (`id`, `mobile`, `username`, `password`, `avatar`) 
VALUES (1, '13800000000', 'Antigravity Admin', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/q7R905e1/1H7eZtTpm0F84lW1e5e', 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg')
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

INSERT INTO `orders` (`id`, `order_id`, `user_id`, `item`, `amount`, `status`)
VALUES (1, 1001, 1, 'Go-Zero Monorepo 实战教程', 99.90, 'PAID')
ON DUPLICATE KEY UPDATE `item` = VALUES(`item`);
