-- 对齐 ITSM 数据表时间戳字段为 go-zero 规范 (create_time, update_time)

ALTER TABLE `itsm_process_def`
  CHANGE COLUMN `created_at` `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHANGE COLUMN `updated_at` `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `itsm_process_inst`
  CHANGE COLUMN `created_at` `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHANGE COLUMN `updated_at` `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `itsm_task`
  CHANGE COLUMN `created_at` `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `itsm_ticket_data`
  CHANGE COLUMN `created_at` `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHANGE COLUMN `updated_at` `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `itsm_task_log`
  CHANGE COLUMN `created_at` `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `itsm_sla_policy`
  CHANGE COLUMN `created_at` `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHANGE COLUMN `updated_at` `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
