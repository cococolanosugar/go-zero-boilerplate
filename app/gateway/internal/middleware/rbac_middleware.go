package middleware

import (
	"encoding/json"
	"net/http"
	"strings"

	"go-zero-boilerplate/app/gateway/internal/svc"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/golang-jwt/jwt/v4"
)

type RbacMiddleware struct {
	svcCtx *svc.ServiceContext
}

func NewRbacMiddleware(svcCtx *svc.ServiceContext) *RbacMiddleware {
	return &RbacMiddleware{svcCtx: svcCtx}
}

func (m *RbacMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. 放行 OPTIONS 预检请求
		if r.Method == http.MethodOptions {
			next(w, r)
			return
		}

		path := r.URL.Path

		// 2. 检查是否为无需鉴权的公开接口
		if isPublicRoute(path) {
			next(w, r)
			return
		}

		// 3. 若携带 Authorization Header，优先检查是否处于强制下线黑名单
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			if m.svcCtx.SessionMgr != nil && m.svcCtx.SessionMgr.IsBlacklisted(r.Context(), tokenStr) {
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusUnauthorized)
				resp := map[string]interface{}{
					"code": 401,
					"msg":  "该账号已被管理员强制下线，请重新登录",
					"data": nil,
				}
				_ = json.NewEncoder(w).Encode(resp)
				return
			}
		}

		// 4. 仅对后台 /api/v1/system/* 接口执行动态 RBAC 权限拦截
		if !strings.HasPrefix(path, "/api/v1/system") {
			next(w, r)
			return
		}

		// 5. 解析 Authorization Header 提取登录态
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			// 未携带有效 Token，放行交由后续 go-zero 官方 JWT 校验器返回 401
			next(w, r)
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return []byte(m.svcCtx.Config.Auth.AccessSecret), nil
		})
		if err != nil || !token.Valid {
			// Token 非法或过期，放行交由后续 JWT 拦截器统一处理
			next(w, r)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			next(w, r)
			return
		}

		var userId int64
		if uidVal, exists := claims["userId"]; exists {
			if uidNum, ok := uidVal.(json.Number); ok {
				userId, _ = uidNum.Int64()
			} else if uidFloat, ok := uidVal.(float64); ok {
				userId = int64(uidFloat)
			}
		}

		if userId <= 0 {
			next(w, r)
			return
		}

		// 5. 个人中心、文件上传与登录认证相关接口（已登录员工人人可访问）
		if strings.HasPrefix(path, "/api/v1/system/personal") || strings.HasPrefix(path, "/api/v1/system/auth") || strings.HasPrefix(path, "/api/v1/system/file/upload") {
			next(w, r)
			return
		}

		// 6. 调用下游 RPC 校验角色权限
		checkResp, err := m.svcCtx.UserRpc.CheckApiPermission(r.Context(), &userClient.CheckApiPermissionRequest{
			UserId: userId,
			Path:   path,
			Method: r.Method,
		})

		if err != nil || checkResp == nil || !checkResp.Allowed {
			// 拦截并返回标准的 HTTP 403 Forbidden 响应
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusForbidden)
			resp := map[string]interface{}{
				"code": 403,
				"msg":  "权限不足，当前角色未被授予访问该接口的权限",
				"data": nil,
			}
			_ = json.NewEncoder(w).Encode(resp)
			return
		}

		next(w, r)
	}
}

func isPublicRoute(path string) bool {
	publicPaths := []string{
		"/api/v1/user/login",
		"/api/v1/user/register",
		"/api/v1/system/auth/login",
		"/api/v1/system/notice/stream",
	}
	for _, p := range publicPaths {
		if path == p {
			return true
		}
	}
	return false
}
