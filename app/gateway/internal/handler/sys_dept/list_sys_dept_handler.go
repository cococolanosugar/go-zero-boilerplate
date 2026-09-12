// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package sys_dept

import (
	"net/http"

	"go-zero-boilerplate/pkg/result"
	"github.com/zeromicro/go-zero/rest/httpx"
	"go-zero-boilerplate/app/gateway/internal/logic/sys_dept"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
)

// 获取部门树形列表
func ListSysDeptHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ListSysDeptReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := sys_dept.NewListSysDeptLogic(r.Context(), svcCtx)
		resp, err := l.ListSysDept(&req)
		result.HttpResult(r, w, resp, err)
	}
}
