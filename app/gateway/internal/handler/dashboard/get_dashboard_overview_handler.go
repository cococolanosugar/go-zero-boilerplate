// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package dashboard

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	"go-zero-boilerplate/app/gateway/internal/logic/dashboard"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
)

// 获取系统大盘聚合信息（mr.Finish 内网并发拉取用户画像与任务统计）
func GetDashboardOverviewHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.DashboardReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := dashboard.NewGetDashboardOverviewLogic(r.Context(), svcCtx)
		resp, err := l.GetDashboardOverview(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
