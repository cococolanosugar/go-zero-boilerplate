package user

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/user"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/pkg/result"
)

// 获取当前登录用户信息（强制由 JWT 提取）
func GetUserInfoHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := user.NewGetUserInfoLogic(r.Context(), svcCtx)
		resp, err := l.GetUserInfo()
		result.HttpResult(r, w, resp, err)
	}
}
