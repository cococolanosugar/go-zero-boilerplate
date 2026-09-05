package system

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/system"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/pkg/result"
)

// 获取系统 API 字典列表
func ListSysApisHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := system.NewListSysApisLogic(r.Context(), svcCtx)
		resp, err := l.ListSysApis()
		result.HttpResult(r, w, resp, err)
	}
}
