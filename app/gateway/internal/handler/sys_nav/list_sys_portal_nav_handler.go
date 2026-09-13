// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package sys_nav

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	"go-zero-boilerplate/app/gateway/internal/logic/sys_nav"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"
)

// 分页查询系统导航配置列表
func ListSysPortalNavHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ListSysPortalNavReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := sys_nav.NewListSysPortalNavLogic(r.Context(), svcCtx)
		resp, err := l.ListSysPortalNav(&req)
		result.HttpResult(r, w, resp, err)
	}
}
