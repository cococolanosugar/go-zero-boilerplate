package system

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/system"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// Casdoor SSO 统一身份登录
func CasdoorLoginHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CasdoorLoginReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := system.NewCasdoorLoginLogic(r.Context(), svcCtx)
		resp, err := l.CasdoorLogin(&req)
		result.HttpResult(r, w, resp, err)
	}
}

