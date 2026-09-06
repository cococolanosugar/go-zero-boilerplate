package order

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/order"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// 获取大盘聚合信息（mr.Finish 内网并发拉取微服务）
func GetDashboardOverviewHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.DashboardReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := order.NewGetDashboardOverviewLogic(r.Context(), svcCtx)
		resp, err := l.GetDashboardOverview(&req)
		result.HttpResult(r, w, resp, err)
	}
}
