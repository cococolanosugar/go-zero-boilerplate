-- Create "sys_async_task" table
CREATE TABLE IF NOT EXISTS `sys_async_task` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `task_name` varchar(128) NOT NULL COMMENT '任务名称',
  `task_key` varchar(64) NOT NULL COMMENT '任务标识(唯一唯一Key)',
  `task_type` varchar(32) NOT NULL DEFAULT 'CRON' COMMENT '任务类型（CRON/WORKFLOW）',
  `cron_expr` varchar(64) NOT NULL DEFAULT '' COMMENT 'Cron表达式 (如 0 0 * * * 或 @every 1m)',
  `workflow_type` varchar(128) NOT NULL DEFAULT 'OrderSagaWorkflow' COMMENT '关联Temporal工作流类型',
  `task_queue` varchar(64) NOT NULL DEFAULT 'ORDER_TASK_QUEUE' COMMENT 'Temporal任务队列',
  `payload` text NOT NULL COMMENT '任务默认入参JSON',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '任务状态（1正常/启用 0暂停/禁用）',
  `last_run_time` datetime DEFAULT NULL COMMENT '最近一次触发运行时间',
  `last_run_status` varchar(32) NOT NULL DEFAULT 'IDLE' COMMENT '最近执行状态（IDLE/RUNNING/SUCCESS/FAILED）',
  `remark` varchar(500) DEFAULT '' COMMENT '备注说明',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_key` (`task_key`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异步定时与工作流任务管理表';

-- 插入初始示例任务
INSERT INTO `sys_async_task` (`id`, `task_name`, `task_key`, `task_type`, `cron_expr`, `workflow_type`, `task_queue`, `payload`, `status`, `last_run_status`, `remark`)
VALUES 
  (1, '订单Saga巡检与超时补偿任务', 'order_saga_patrol', 'CRON', '*/10 * * * *', 'OrderSagaWorkflow', 'ORDER_TASK_QUEUE', '{"item":"巡检定时任务","amount":99.0,"timeoutSeconds":15}', 1, 'IDLE', '自动定时派发Saga工作流并执行订单状态流转'),
  (2, '用户积分月度重置工作流', 'user_points_settle', 'CRON', '0 0 1 * *', 'OrderSagaWorkflow', 'ORDER_TASK_QUEUE', '{"item":"月度积分清算","amount":10.0,"timeoutSeconds":30}', 0, 'IDLE', '每月1号凌晨调度执行用户积分对账');

-- 插入一级菜单：任务管理 (ID = 45, parent_id = 0, type = 2 [菜单], sort = 6)
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`, `visible`, `status`)
VALUES (45, 0, '任务管理', 2, '/tasks', 'SysTask', 'system:task:view', 'ScheduleOutlined', 6, 1, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `type` = VALUES(`type`), `path` = VALUES(`path`), `component` = VALUES(`component`);

-- 插入按钮级权限 (type = 3 [按钮])
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`, `visible`, `status`)
VALUES 
  (451, 45, '任务新增', 3, '', '', 'system:task:add', '', 1, 1, 1),
  (452, 45, '任务修改', 3, '', '', 'system:task:edit', '', 2, 1, 1),
  (453, 45, '任务删除', 3, '', '', 'system:task:delete', '', 3, 1, 1),
  (454, 45, '任务执行', 3, '', '', 'system:task:trigger', '', 4, 1, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `type` = VALUES(`type`), `permission_code` = VALUES(`permission_code`);

-- 调整后续一级菜单排序 (系统配置=7, 系统监控=8, 个人中心=9)
UPDATE sys_menu SET sort = 7 WHERE id = 3; -- 系统配置
UPDATE sys_menu SET sort = 8 WHERE id = 5; -- 系统监控
UPDATE sys_menu SET sort = 9 WHERE id = 4; -- 个人中心
