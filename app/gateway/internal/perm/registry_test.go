package perm

import (
	"sync"
	"testing"
)

func TestRegistry_RegisterGroupAndExport(t *testing.T) {
	resetRegistry()

	RegisterGroup("user", "用户管理", []Item{
		{Code: "system:user:list", Name: "查询用户列表"},
		{Code: "system:user:create", Name: "新增用户"},
	})

	RegisterGroup("dict", "字典管理", []Item{
		{Code: "system:dict:list", Name: "查询字典列表"},
	})

	// 验证 All()
	all := All()
	if len(all) != 2 {
		t.Fatalf("expected 2 groups, got %d", len(all))
	}
	if all[0].Key != "user" || len(all[0].Permissions) != 2 {
		t.Errorf("unexpected user group: %+v", all[0])
	}
	if all[1].Key != "dict" || len(all[1].Permissions) != 1 {
		t.Errorf("unexpected dict group: %+v", all[1])
	}

	// 验证 AllCodes()
	codes := AllCodes()
	if len(codes) != 3 {
		t.Fatalf("expected 3 codes, got %d", len(codes))
	}
	expected := []string{"system:user:list", "system:user:create", "system:dict:list"}
	for i, c := range codes {
		if c != expected[i] {
			t.Errorf("code index %d = %s, want %s", i, c, expected[i])
		}
	}

	// 验证追加已存在的 group key
	RegisterGroup("user", "用户管理更新", []Item{
		{Code: "system:user:delete", Name: "删除用户"},
	})
	allUpdated := All()
	if len(allUpdated) != 2 {
		t.Errorf("expected still 2 groups, got %d", len(allUpdated))
	}
	if len(allUpdated[0].Permissions) != 3 {
		t.Errorf("expected 3 permissions in user group, got %d", len(allUpdated[0].Permissions))
	}
}

func TestRegistry_Concurrency(t *testing.T) {
	resetRegistry()

	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			RegisterGroup("test", "测试模块", []Item{
				{Code: "test:action", Name: "测试操作"},
			})
			_ = All()
			_ = AllCodes()
		}(i)
	}
	wg.Wait()
}
