package system

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/system"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/pkg/result"
)

// 获取当前登录员工画像与权限
func GetAdminProfileHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := system.NewGetAdminProfileLogic(r.Context(), svcCtx)
		resp, err := l.GetAdminProfile()
		result.HttpResult(r, w, resp, err)
	}
}
