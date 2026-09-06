package system

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/system"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// 获取操作日志列表
func ListSysOperLogsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ListSysOperLogsReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := system.NewListSysOperLogsLogic(r.Context(), svcCtx)
		resp, err := l.ListSysOperLogs(&req)
		result.HttpResult(r, w, resp, err)
	}
}
