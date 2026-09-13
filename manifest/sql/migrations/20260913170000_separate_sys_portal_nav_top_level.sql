-- 将网址导航 (ID=38) 独立为一级路由，放在通知公告下面 (parent_id = 0, path = '/navigation', sort = 6)
UPDATE `sys_menu` SET `parent_id` = 0, `title` = '网址导航', `path` = '/navigation', `component` = 'System/Navigation', `icon` = 'CompassOutlined', `sort` = 6 WHERE `id` = 38;

-- 调整后续一级菜单排序 (任务管理=7, 系统配置=8, 系统监控=9, 个人中心=10)
UPDATE `sys_menu` SET `sort` = 7 WHERE `id` = 45; -- 任务管理
UPDATE `sys_menu` SET `sort` = 8 WHERE `id` = 3;  -- 系统配置
UPDATE `sys_menu` SET `sort` = 9 WHERE `id` = 5;  -- 系统监控
UPDATE `sys_menu` SET `sort` = 10 WHERE `id` = 4; -- 个人中心
