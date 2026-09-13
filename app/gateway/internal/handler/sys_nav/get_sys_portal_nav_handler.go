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

// 获取导航站点详情
func GetSysPortalNavHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.GetSysPortalNavReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := sys_nav.NewGetSysPortalNavLogic(r.Context(), svcCtx)
		resp, err := l.GetSysPortalNav(&req)
		result.HttpResult(r, w, resp, err)
	}
}
