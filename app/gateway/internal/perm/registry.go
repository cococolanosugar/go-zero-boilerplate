package perm

import "sync"

// Item 单个权限点元数据
type Item struct {
	Code string `json:"code"` // 权限标识，例如 "system:user:create"
	Name string `json:"name"` // 权限显示名称，例如 "创建用户"
}

// Group 模块分组权限树
type Group struct {
	Key         string `json:"key"`         // 分组键名，例如 "user"
	Title       string `json:"title"`       // 分组显示标题，例如 "用户管理"
	Permissions []Item `json:"permissions"` // 该分组下的具体权限列表
}

var (
	mu     sync.RWMutex
	groups []Group
)

// RegisterGroup 供各模块注册其业务权限列表
func RegisterGroup(key, title string, items []Item) {
	mu.Lock()
	defer mu.Unlock()

	for i, g := range groups {
		if g.Key == key {
			groups[i].Title = title
			groups[i].Permissions = append(groups[i].Permissions, items...)
			return
		}
	}

	groups = append(groups, Group{
		Key:         key,
		Title:       title,
		Permissions: items,
	})
}

// All 返回全量结构化权限树（供前端角色授权 Tree 组件消费）
func All() []Group {
	mu.RLock()
	defer mu.RUnlock()

	res := make([]Group, len(groups))
	for i, g := range groups {
		perms := make([]Item, len(g.Permissions))
		copy(perms, g.Permissions)
		res[i] = Group{
			Key:         g.Key,
			Title:       g.Title,
			Permissions: perms,
		}
	}
	return res
}

// AllCodes 返回全量扁平化的权限编码切片
func AllCodes() []string {
	mu.RLock()
	defer mu.RUnlock()

	var codes []string
	for _, g := range groups {
		for _, item := range g.Permissions {
			codes = append(codes, item.Code)
		}
	}
	return codes
}

// resetRegistry 仅供单元测试重置全局注册池
func resetRegistry() {
	mu.Lock()
	defer mu.Unlock()
	groups = nil
}
