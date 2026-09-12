package system

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	"go-zero-boilerplate/app/gateway/internal/logic/system"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"
)

// 强退指定在线用户会话
func ForceLogoutOnlineSessionHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ForceLogoutReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := system.NewForceLogoutOnlineSessionLogic(r.Context(), svcCtx)
		resp, err := l.ForceLogoutOnlineSession(&req)
		result.HttpResult(r, w, resp, err)
	}
}
