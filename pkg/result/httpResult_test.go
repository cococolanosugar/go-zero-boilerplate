package result

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"go-zero-boilerplate/pkg/xerr"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestHttpResult(t *testing.T) {
	t.Run("success response", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/test", nil)

		type demoData struct {
			Name string `json:"name"`
		}

		HttpResult(r, w, demoData{Name: "antigravity"}, nil)

		if w.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", w.Code)
		}

		var resp Response
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("unmarshal error: %v", err)
		}

		if resp.Code != 200 || resp.Msg != "SUCCESS" {
			t.Errorf("expected code 200 SUCCESS, got code %d msg %s", resp.Code, resp.Msg)
		}
	})

	t.Run("grpc error unpacked correctly", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/test", nil)

		grpcErr := status.Error(codes.Unknown, "ErrCode:200001, ErrMsg:用户不存在")
		HttpResult(r, w, nil, grpcErr)

		if w.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", w.Code)
		}

		var resp Response
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("unmarshal error: %v", err)
		}

		if resp.Code != xerr.UserNotFound {
			t.Errorf("expected code %d, got %d", xerr.UserNotFound, resp.Code)
		}
		if resp.Msg != "用户不存在" {
			t.Errorf("expected msg '用户不存在', got '%s'", resp.Msg)
		}
	})

	t.Run("param error returns 400", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/test", nil)

		ParamErrorResult(r, w, xerr.NewErrCode(xerr.RequestParamError))

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400, got %d", w.Code)
		}
	})
}
