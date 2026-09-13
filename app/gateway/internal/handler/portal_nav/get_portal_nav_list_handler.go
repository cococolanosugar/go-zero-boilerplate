// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package portal_nav

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	"go-zero-boilerplate/app/gateway/internal/logic/portal_nav"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"
)

// 获取门户公开网址导航列表
func GetPortalNavListHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.GetPortalNavListReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := portal_nav.NewGetPortalNavListLogic(r.Context(), svcCtx)
		resp, err := l.GetPortalNavList(&req)
		result.HttpResult(r, w, resp, err)
	}
}
