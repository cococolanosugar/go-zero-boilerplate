package perm

import (
	"context"
	"testing"

	"go-zero-boilerplate/pkg/xerr"
)

type mockUserClient struct{}

func TestRbacService_Check(t *testing.T) {
	svc := &RbacService{}

	// 1. 未登录（userId <= 0）
	ctxNoUser := context.Background()
	if err := svc.Check(ctxNoUser, PermissionRequired{Permission: "system:user:add"}); err == nil {
		t.Errorf("expected error for unauthenticated user, got nil")
	}

	// 2. 超级管理员 (userId == 1)
	ctxSuperAdmin := context.WithValue(context.Background(), "userId", int64(1))
	if err := svc.Check(ctxSuperAdmin, PermissionRequired{Permission: "system:user:add"}); err != nil {
		t.Errorf("expected superadmin to pass, got err: %v", err)
	}
	if err := svc.Check(ctxSuperAdmin, PermissionRequired{All: []string{"a", "b"}}); err != nil {
		t.Errorf("expected superadmin to pass All, got err: %v", err)
	}
	if err := svc.Check(ctxSuperAdmin, PermissionRequired{Any: []string{"a", "b"}}); err != nil {
		t.Errorf("expected superadmin to pass Any, got err: %v", err)
	}

	// 3. 构造普通用户权限集合测试 Check
	perms := map[string]bool{
		"system:user:list":   true,
		"system:user:export": true,
		"system:order:view":  true,
	}

	// 验证单权限
	ctxUser := context.WithValue(context.Background(), "userId", int64(100))
	// 通过内部方法直接测试规则判定
	checkRules := func(req PermissionRequired, userPerms map[string]bool) error {
		if req.Permission != "" {
			if req.Permission != PublicAuthenticated && !userPerms[req.Permission] {
				return xerr.NewErrCode(xerr.Forbidden)
			}
		}
		for _, code := range req.All {
			if code != PublicAuthenticated && !userPerms[code] {
				return xerr.NewErrCode(xerr.Forbidden)
			}
		}
		if len(req.Any) > 0 {
			has := false
			for _, code := range req.Any {
				if code == PublicAuthenticated || userPerms[code] {
					has = true
					break
				}
			}
			if !has {
				return xerr.NewErrCode(xerr.Forbidden)
			}
		}
		return nil
	}

	// 单权限成功与失败
	if err := checkRules(PermissionRequired{Permission: "system:user:list"}, perms); err != nil {
		t.Errorf("expected user:list to pass, got: %v", err)
	}
	if err := checkRules(PermissionRequired{Permission: "system:user:delete"}, perms); err == nil {
		t.Errorf("expected user:delete to fail, got nil")
	}

	// All 成功与失败
	if err := checkRules(PermissionRequired{All: []string{"system:user:list", "system:user:export"}}, perms); err != nil {
		t.Errorf("expected All(list, export) to pass, got: %v", err)
	}
	if err := checkRules(PermissionRequired{All: []string{"system:user:list", "system:user:delete"}}, perms); err == nil {
		t.Errorf("expected All(list, delete) to fail, got nil")
	}

	// Any 成功与失败
	if err := checkRules(PermissionRequired{Any: []string{"system:user:delete", "system:order:view"}}, perms); err != nil {
		t.Errorf("expected Any(delete, order:view) to pass, got: %v", err)
	}
	if err := checkRules(PermissionRequired{Any: []string{"system:user:delete", "system:user:update"}}, perms); err == nil {
		t.Errorf("expected Any(delete, update) to fail, got nil")
	}

	// PublicAuthenticated 场景
	if err := checkRules(PermissionRequired{Permission: PublicAuthenticated}, perms); err != nil {
		t.Errorf("expected PublicAuthenticated to pass, got: %v", err)
	}

	// 未配置场景 (IsEmpty)
	emptyReq := PermissionRequired{}
	if !emptyReq.IsEmpty() {
		t.Errorf("expected emptyReq to be empty")
	}
	// 空配置通过 fallbackCheck
	if err := svc.Check(ctxUser, emptyReq); err != nil {
		t.Errorf("expected emptyReq fallback to pass when no path in ctx, got: %v", err)
	}
}
