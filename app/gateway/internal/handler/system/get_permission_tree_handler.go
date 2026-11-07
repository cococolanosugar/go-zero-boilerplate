package system

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/system"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/pkg/result"
)

// 获取系统全量功能权限树
func GetPermissionTreeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := system.NewGetPermissionTreeLogic(r.Context(), svcCtx)
		resp, err := l.GetPermissionTree()
		result.HttpResult(r, w, resp, err)
	}
}
