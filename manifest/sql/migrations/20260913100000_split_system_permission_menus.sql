-- 拆分"系统与权限"为"权限管理"与"系统配置"两大独立分组

-- 1. 创建"权限管理"一级目录菜单 (ID=6)
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (6, 0, '权限管理', 1, '/permission', '', 'permission:dir', 'SafetyCertificateOutlined', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `path` = VALUES(`path`), `icon` = VALUES(`icon`), `sort` = VALUES(`sort`);

-- 2. 将原"系统权限" (ID=3) 重命名为"系统配置"，排序后移至 4
UPDATE `sys_menu`
SET `title` = '系统配置', `sort` = 4, `icon` = 'SettingOutlined'
WHERE `id` = 3;

-- 3. 将组织权限相关子菜单迁移至"权限管理" (parent_id = 6)，并更新路由前缀为 /permission/*
UPDATE `sys_menu` SET `parent_id` = 6, `path` = '/permission/dept', `sort` = 1 WHERE `id` = 37;
UPDATE `sys_menu` SET `parent_id` = 6, `path` = '/permission/sys-post', `sort` = 2 WHERE `id` = 38;
UPDATE `sys_menu` SET `parent_id` = 6, `path` = '/permission/users', `sort` = 3 WHERE `id` = 31;
UPDATE `sys_menu` SET `parent_id` = 6, `path` = '/permission/roles', `sort` = 4 WHERE `id` = 32;
UPDATE `sys_menu` SET `parent_id` = 6, `path` = '/permission/menus', `sort` = 5 WHERE `id` = 33;

-- 4. 调整"系统配置" (parent_id = 3) 子菜单的排序与相对关系
UPDATE `sys_menu` SET `parent_id` = 3, `sort` = 1 WHERE `id` = 42; -- 参数设置
UPDATE `sys_menu` SET `parent_id` = 3, `sort` = 2 WHERE `id` = 35; -- 数据字典
UPDATE `sys_menu` SET `parent_id` = 3, `sort` = 3 WHERE `id` = 34; -- 接口字典
UPDATE `sys_menu` SET `parent_id` = 3, `sort` = 4 WHERE `id` = 39; -- 通知公告

-- 5. 系统监控与个人中心排序顺延
UPDATE `sys_menu` SET `sort` = 5 WHERE `id` = 5; -- 系统监控
UPDATE `sys_menu` SET `sort` = 6 WHERE `id` = 4; -- 个人中心
