// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package sys_notice

import (
	"net/http"

	"go-zero-boilerplate/pkg/result"
	"github.com/zeromicro/go-zero/rest/httpx"
	"go-zero-boilerplate/app/gateway/internal/logic/sys_notice"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
)

// 获取通知公告表列表
func ListSysNoticeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ListSysNoticeReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := sys_notice.NewListSysNoticeLogic(r.Context(), svcCtx)
		resp, err := l.ListSysNotice(&req)
		result.HttpResult(r, w, resp, err)
	}
}
