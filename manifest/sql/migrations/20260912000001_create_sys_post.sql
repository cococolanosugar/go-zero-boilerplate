-- Create "sys_post" table
CREATE TABLE `sys_post` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '岗位ID',
  `post_code` varchar(64) NOT NULL COMMENT '岗位编码',
  `post_name` varchar(50) NOT NULL COMMENT '岗位名称',
  `post_sort` int NOT NULL DEFAULT '0' COMMENT '显示顺序',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态（1正常 0停用）',
  `remark` varchar(500) DEFAULT '' COMMENT '备注',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_code` (`post_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位信息表';
