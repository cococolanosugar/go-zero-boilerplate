-- 采用方案 A：将组织架构独立为一级目录"组织管理" (ID=7, /org)，权限管理聚焦于 IAM (ID=6, /permission)

-- 1. 创建"组织管理"一级目录菜单 (ID=7)
INSERT INTO `sys_menu` (`id`, `parent_id`, `title`, `type`, `path`, `component`, `permission_code`, `icon`, `sort`)
VALUES (7, 0, '组织管理', 1, '/org', '', 'org:dir', 'ApartmentOutlined', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `path` = VALUES(`path`), `icon` = VALUES(`icon`), `sort` = VALUES(`sort`);

-- 2. 将部门管理 (37) 与岗位管理 (38) 迁移归属至"组织管理" (parent_id = 7)
UPDATE `sys_menu` SET `parent_id` = 7, `path` = '/org/dept', `sort` = 1 WHERE `id` = 37;
UPDATE `sys_menu` SET `parent_id` = 7, `path` = '/org/post', `sort` = 2 WHERE `id` = 38;

-- 3. 调整"权限管理" (ID=6) 目录与子菜单
UPDATE `sys_menu` SET `sort` = 4 WHERE `id` = 6;
UPDATE `sys_menu` SET `parent_id` = 6, `path` = '/permission/users', `sort` = 1 WHERE `id` = 31;
UPDATE `sys_menu` SET `parent_id` = 6, `path` = '/permission/roles', `sort` = 2 WHERE `id` = 32;
UPDATE `sys_menu` SET `parent_id` = 6, `path` = '/permission/menus', `sort` = 3 WHERE `id` = 33;

-- 4. 调整"系统配置"、"系统监控"与"个人中心"全局一级目录排序
UPDATE `sys_menu` SET `sort` = 5 WHERE `id` = 3; -- 系统配置
UPDATE `sys_menu` SET `sort` = 6 WHERE `id` = 5; -- 系统监控
UPDATE `sys_menu` SET `sort` = 7 WHERE `id` = 4; -- 个人中心
