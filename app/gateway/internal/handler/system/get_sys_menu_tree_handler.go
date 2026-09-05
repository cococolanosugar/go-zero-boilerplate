package system

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/system"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/pkg/result"
)

// 获取全量菜单与按钮树
func GetSysMenuTreeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := system.NewGetSysMenuTreeLogic(r.Context(), svcCtx)
		resp, err := l.GetSysMenuTree()
		result.HttpResult(r, w, resp, err)
	}
}
