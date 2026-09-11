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

// 获取岗位信息表列表
func ListSysPostHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ListSysPostReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := sys_post.NewListSysPostLogic(r.Context(), svcCtx)
		resp, err := l.ListSysPost(&req)
		result.HttpResult(r, w, resp, err)
	}
}
