// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package sys_post

import (
	"net/http"

	"go-zero-boilerplate/pkg/result"
	"github.com/zeromicro/go-zero/rest/httpx"
	"go-zero-boilerplate/app/gateway/internal/logic/sys_post"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
)

// 获取岗位信息表详情
func GetSysPostHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.SysIdReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := sys_post.NewGetSysPostLogic(r.Context(), svcCtx)
		resp, err := l.GetSysPost(&req)
		result.HttpResult(r, w, resp, err)
	}
}
