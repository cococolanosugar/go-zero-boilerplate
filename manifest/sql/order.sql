CREATE TABLE `orders` (
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
