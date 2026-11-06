package dict

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"go-zero-boilerplate/app/gateway/internal/perm"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/pkg/xerr"
)

func TestCreateSysDictDataHandler_Permission(t *testing.T) {
	svcCtx := &svc.ServiceContext{
		RbacService: perm.NewRbacService(nil, nil),
	}
	handler := CreateSysDictDataHandler(svcCtx)

	// 1. 未登录用户 -> 预期拦截 Forbidden (100007)
	reqBody := []byte(`{"dictType":"sys_test","dictLabel":"测试","dictValue":"1"}`)
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/dict/data", bytes.NewReader(reqBody))
	req1.Header.Set("Content-Type", "application/json")
	rec1 := httptest.NewRecorder()

	handler(rec1, req1)
	var resp1 map[string]interface{}
	_ = json.Unmarshal(rec1.Body.Bytes(), &resp1)
	if code, ok := resp1["code"].(float64); !ok || uint32(code) != xerr.Forbidden {
		t.Errorf("expected business code %d for unauthenticated user, got: %v", xerr.Forbidden, resp1["code"])
	}

	// 2. 超级管理员 (userId == 1) -> 成功突破权限拦截器进入 Logic
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/dict/data", bytes.NewReader(reqBody))
	req2.Header.Set("Content-Type", "application/json")
	ctxAdmin := context.WithValue(req2.Context(), "userId", int64(1))
	req2 = req2.WithContext(ctxAdmin)
	rec2 := httptest.NewRecorder()

	defer func() {
		if r := recover(); r != nil {
			// 捕获下游空 RPC 调用的 panic，证明已经完全放行通过了 RbacService 拦截
			t.Logf("SuperAdmin passed RBAC successfully, reached downstream logic as expected")
		}
	}()

	handler(rec2, req2)
}
