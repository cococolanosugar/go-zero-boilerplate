package system

import (
	"context"
	"testing"

	"go-zero-boilerplate/app/gateway/internal/svc"
)

func TestGetPermissionTreeLogic_GetPermissionTree(t *testing.T) {
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{}
	l := NewGetPermissionTreeLogic(ctx, svcCtx)

	resp, err := l.GetPermissionTree()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp == nil {
		t.Fatal("expected resp not to be nil")
	}
	if len(resp.List) == 0 {
		t.Fatal("expected permission tree list not to be empty")
	}

	// 验证包含 user 分组
	foundUser := false
	for _, g := range resp.List {
		if g.Key == "user" {
			foundUser = true
			if len(g.Permissions) == 0 {
				t.Errorf("expected user permissions not to be empty")
			}
			break
		}
	}
	if !foundUser {
		t.Errorf("expected to find 'user' permission group in tree")
	}
}
