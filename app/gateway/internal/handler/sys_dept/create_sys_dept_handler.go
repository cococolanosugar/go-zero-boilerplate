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

// 创建新部门
func CreateSysDeptHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateSysDeptReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := sys_dept.NewCreateSysDeptLogic(r.Context(), svcCtx)
		resp, err := l.CreateSysDept(&req)
		result.HttpResult(r, w, resp, err)
	}
}
