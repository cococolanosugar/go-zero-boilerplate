package perm

// PermissionRequired 统一权限判决参数对象
type PermissionRequired struct {
	Permission string   // 单权限标识（如 perm.UserCreate）
	All        []string // 必须全部满足的复合权限 (AND 语义)
	Any        []string // 满足任一即可的复合权限 (OR 语义)
}

// IsEmpty 判断是否未声明任何权限点（用于识别未配置场景）
func (p PermissionRequired) IsEmpty() bool {
	return p.Permission == "" && len(p.All) == 0 && len(p.Any) == 0
}
