package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"go-zero-boilerplate/app/gateway/internal/svc"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/golang-jwt/jwt/v4"
)

type OperLogMiddleware struct {
	svcCtx *svc.ServiceContext
}

func NewOperLogMiddleware(svcCtx *svc.ServiceContext) *OperLogMiddleware {
	return &OperLogMiddleware{svcCtx: svcCtx}
}

type statusLoggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (w *statusLoggingResponseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

func (m *OperLogMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			next(w, r)
			return
		}

		path := r.URL.Path
		method := r.Method

		// 仅对增删改操作且在系统管理接口范围内的请求进行操作审计
		isMutating := method == http.MethodPost || method == http.MethodPut || method == http.MethodDelete || method == http.MethodPatch
		shouldLog := isMutating && strings.HasPrefix(path, "/api/v1/system") && !strings.Contains(path, "/auth/login")

		if !shouldLog {
			next(w, r)
			return
		}

		start := time.Now()
		wrappedWriter := &statusLoggingResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// 提取操作人账号
		var operName = "anonymous"
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
				return []byte(m.svcCtx.Config.Auth.AccessSecret), nil
			})
			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					if uidVal, exists := claims["userId"]; exists {
						operName = fmt.Sprintf("UID:%v", uidVal)
					}
				}
			}
		}

		next(wrappedWriter, r)

		costTime := time.Since(start).Milliseconds()
		status := 1
		errMsg := ""
		if wrappedWriter.statusCode >= 400 {
			status = 0
			errMsg = http.StatusText(wrappedWriter.statusCode)
		}

		clientIp := r.Header.Get("X-Forwarded-For")
		if clientIp == "" {
			clientIp = r.Header.Get("X-Real-IP")
		}
		if clientIp == "" {
			clientIp = r.RemoteAddr
		}
		if idx := strings.Index(clientIp, ":"); idx != -1 {
			clientIp = clientIp[:idx]
		}

		// 异步入库，不阻塞用户主响应
		go func() {
			_, _ = m.svcCtx.UserRpc.RecordOperLog(context.Background(), &userClient.RecordOperLogRequest{
				Title:      "系统管理接口操作",
				OperName:   operName,
				OperUrl:    path,
				OperMethod: method,
				OperIp:     clientIp,
				Status:     int32(status),
				ErrorMsg:   errMsg,
				CostTime:   costTime,
			})
		}()
	}
}
