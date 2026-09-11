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

// 创建岗位信息表
func CreateSysPostHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateSysPostReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := sys_post.NewCreateSysPostLogic(r.Context(), svcCtx)
		resp, err := l.CreateSysPost(&req)
		result.HttpResult(r, w, resp, err)
	}
}
