-- 将员工管理 (ID=31) 从权限管理移至组织管理 (parent_id = 7)，形成"人·岗·部"组织闭环

-- 1. 将员工管理迁移至组织管理 (parent_id = 7)，路径变更为 /org/users，排序调整为 1
UPDATE `sys_menu` SET `parent_id` = 7, `path` = '/org/users', `sort` = 1 WHERE `id` = 31;

-- 2. 调整组织管理下部门管理与岗位管理的排序
UPDATE `sys_menu` SET `sort` = 2 WHERE `id` = 37; -- 部门管理
UPDATE `sys_menu` SET `sort` = 3 WHERE `id` = 38; -- 岗位管理

-- 3. 调整权限管理下角色管理与菜单管理的排序
UPDATE `sys_menu` SET `sort` = 1 WHERE `id` = 32; -- 角色权限
UPDATE `sys_menu` SET `sort` = 2 WHERE `id` = 33; -- 菜单管理
