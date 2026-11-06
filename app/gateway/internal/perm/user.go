package perm

const (
	// 用户管理
	UserList     = "system:user:list"
	UserCreate   = "system:user:create"
	UserUpdate   = "system:user:update"
	UserDelete   = "system:user:delete"
	UserResetPwd = "system:user:reset_pwd"
	UserExport   = "system:user:export"

	// 角色管理
	RoleList           = "system:role:list"
	RoleCreate         = "system:role:create"
	RoleUpdate         = "system:role:update"
	RoleDelete         = "system:role:delete"
	RoleSetPermissions = "system:role:set_permissions"

	// 部门管理
	DeptList   = "system:dept:list"
	DeptCreate = "system:dept:create"
	DeptUpdate = "system:dept:update"
	DeptDelete = "system:dept:delete"

	// 菜单与权限管理
	MenuList   = "system:menu:list"
	MenuCreate = "system:menu:create"
	MenuUpdate = "system:menu:update"
	MenuDelete = "system:menu:delete"
)

func init() {
	RegisterGroup("user", "用户管理", []Item{
		{Code: UserList, Name: "查询用户列表"},
		{Code: UserCreate, Name: "新增用户"},
		{Code: UserUpdate, Name: "编辑用户"},
		{Code: UserDelete, Name: "删除用户"},
		{Code: UserResetPwd, Name: "重置用户密码"},
		{Code: UserExport, Name: "导出用户数据"},
	})

	RegisterGroup("role", "角色权限", []Item{
		{Code: RoleList, Name: "查询角色列表"},
		{Code: RoleCreate, Name: "新增角色"},
		{Code: RoleUpdate, Name: "编辑角色"},
		{Code: RoleDelete, Name: "删除角色"},
		{Code: RoleSetPermissions, Name: "分配角色权限"},
	})

	RegisterGroup("dept", "部门架构", []Item{
		{Code: DeptList, Name: "查询部门树"},
		{Code: DeptCreate, Name: "新增部门"},
		{Code: DeptUpdate, Name: "编辑部门"},
		{Code: DeptDelete, Name: "删除部门"},
	})

	RegisterGroup("menu", "菜单权限", []Item{
		{Code: MenuList, Name: "查询菜单树"},
		{Code: MenuCreate, Name: "新增菜单"},
		{Code: MenuUpdate, Name: "编辑菜单"},
		{Code: MenuDelete, Name: "删除菜单"},
	})
}
