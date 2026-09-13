-- 将通知公告 (ID=39) 独立为一级路由 (parent_id = 0, path = '/notice', sort = 5)
UPDATE sys_menu SET parent_id = 0, path = '/notice', sort = 5 WHERE id = 39;

-- 调整后续一级菜单排序 (系统配置=6, 系统监控=7, 个人中心=8)
UPDATE sys_menu SET sort = 6 WHERE id = 3; -- 系统配置
UPDATE sys_menu SET sort = 7 WHERE id = 5; -- 系统监控
UPDATE sys_menu SET sort = 8 WHERE id = 4; -- 个人中心
