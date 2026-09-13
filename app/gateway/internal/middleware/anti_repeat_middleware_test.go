package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/pkg/result"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/stretchr/testify/assert"
	"github.com/zeromicro/go-zero/core/stores/redis/redistest"
)

func TestAntiRepeatMiddleware_SafeMethodsBypass(t *testing.T) {
	r := redistest.CreateRedis(t)
	svcCtx := &svc.ServiceContext{RedisClient: r}
	mw := NewAntiRepeatMiddleware(svcCtx)

	handlerCalled := false
	handler := mw.Handle(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
	w := httptest.NewRecorder()
	handler(w, req)

	assert.True(t, handlerCalled)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAntiRepeatMiddleware_MultipartBypass(t *testing.T) {
	r := redistest.CreateRedis(t)
	svcCtx := &svc.ServiceContext{RedisClient: r}
	mw := NewAntiRepeatMiddleware(svcCtx)

	handlerCalled := false
	handler := mw.Handle(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/upload", bytes.NewBufferString("dummy file"))
	req.Header.Set("Content-Type", "multipart/form-data; boundary=something")
	w := httptest.NewRecorder()
	handler(w, req)

	assert.True(t, handlerCalled)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAntiRepeatMiddleware_AuthBypass(t *testing.T) {
	r := redistest.CreateRedis(t)
	svcCtx := &svc.ServiceContext{RedisClient: r}
	mw := NewAntiRepeatMiddleware(svcCtx)

	callCount := 0
	handler := mw.Handle(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		w.WriteHeader(http.StatusOK)
	})

	// 连续发出两次完全相同的 Casdoor SSO 换票请求，白名单放行，不阻断
	body := `{"code":"casdoor_test_code_123","state":"test_state"}`
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/system/auth/casdoor/login", bytes.NewBufferString(body))
	w1 := httptest.NewRecorder()
	handler(w1, req1)

	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/system/auth/casdoor/login", bytes.NewBufferString(body))
	w2 := httptest.NewRecorder()
	handler(w2, req2)

	assert.Equal(t, 2, callCount)
	assert.Equal(t, http.StatusOK, w1.Code)
	assert.Equal(t, http.StatusOK, w2.Code)
}

func TestAntiRepeatMiddleware_NilRedisFailsOpen(t *testing.T) {
	svcCtx := &svc.ServiceContext{RedisClient: nil}
	mw := NewAntiRepeatMiddleware(svcCtx)

	handlerCalled := false
	handler := mw.Handle(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBufferString(`{"item":"test"}`))
	w := httptest.NewRecorder()
	handler(w, req)

	assert.True(t, handlerCalled)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAntiRepeatMiddleware_BlocksDuplicateSubmission(t *testing.T) {
	r := redistest.CreateRedis(t)
	svcCtx := &svc.ServiceContext{RedisClient: r}
	mw := NewAntiRepeatMiddleware(svcCtx)

	callCount := 0
	var receivedBody []byte
	handler := mw.Handle(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		receivedBody, _ = io.ReadAll(r.Body)
		result.HttpResult(r, w, "created", nil)
	})

	payload := `{"title":"System Notice","content":"Hello World"}`

	// First submission: should succeed and downstream should read intact body
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/system/notice", bytes.NewBufferString(payload))
	req1.RemoteAddr = "127.0.0.1:12345"
	w1 := httptest.NewRecorder()
	handler(w1, req1)

	assert.Equal(t, 1, callCount)
	assert.Equal(t, payload, string(receivedBody))
	assert.Equal(t, http.StatusOK, w1.Code)

	var resp1 struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
	}
	_ = json.Unmarshal(w1.Body.Bytes(), &resp1)
	assert.Equal(t, 200, resp1.Code)

	// Second immediate duplicate submission: should be blocked by anti-repeat middleware
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/system/notice", bytes.NewBufferString(payload))
	req2.RemoteAddr = "127.0.0.1:12345"
	w2 := httptest.NewRecorder()
	handler(w2, req2)

	assert.Equal(t, 1, callCount, "Downstream handler should not be called on duplicate submission")

	var resp2 struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
	}
	_ = json.Unmarshal(w2.Body.Bytes(), &resp2)
	assert.Equal(t, int(xerr.RepeatSubmitError), resp2.Code)
	assert.Contains(t, resp2.Msg, "请勿频繁重复提交")

	// Third submission with different payload: should succeed
	req3 := httptest.NewRequest(http.MethodPost, "/api/v1/system/notice", bytes.NewBufferString(`{"title":"Different"}`))
	req3.RemoteAddr = "127.0.0.1:12345"
	w3 := httptest.NewRecorder()
	handler(w3, req3)

	assert.Equal(t, 2, callCount)
}

func TestAntiRepeatMiddleware_ExplicitIdempotencyKey(t *testing.T) {
	r := redistest.CreateRedis(t)
	svcCtx := &svc.ServiceContext{RedisClient: r}
	mw := NewAntiRepeatMiddleware(svcCtx)

	callCount := 0
	handler := mw.Handle(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		result.HttpResult(r, w, "ok", nil)
	})

	idempotencyKey := "unique-client-uuid-123456"

	// First request with idempotency key
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBufferString(`{"amount":100}`))
	req1.Header.Set("X-Idempotency-Key", idempotencyKey)
	w1 := httptest.NewRecorder()
	handler(w1, req1)

	assert.Equal(t, 1, callCount)

	// Second request with SAME idempotency key (even with slightly different payload or retry)
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBufferString(`{"amount":100}`))
	req2.Header.Set("X-Idempotency-Key", idempotencyKey)
	w2 := httptest.NewRecorder()
	handler(w2, req2)

	assert.Equal(t, 1, callCount)
	var resp2 struct {
		Code int `json:"code"`
	}
	_ = json.Unmarshal(w2.Body.Bytes(), &resp2)
	assert.Equal(t, int(xerr.RepeatSubmitError), resp2.Code)
}
