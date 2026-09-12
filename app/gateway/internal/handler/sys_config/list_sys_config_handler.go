// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package sys_config

import (
	"net/http"

	"go-zero-boilerplate/pkg/result"
	"github.com/zeromicro/go-zero/rest/httpx"
	"go-zero-boilerplate/app/gateway/internal/logic/sys_config"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
)

// 获取参数配置表列表
func ListSysConfigHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ListSysConfigReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := sys_config.NewListSysConfigLogic(r.Context(), svcCtx)
		resp, err := l.ListSysConfig(&req)
		result.HttpResult(r, w, resp, err)
	}
}
