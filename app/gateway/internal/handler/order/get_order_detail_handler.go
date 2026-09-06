package order

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/order"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// 获取订单详情（聚合订单与用户信息）
func GetOrderDetailHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.OrderDetailReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := order.NewGetOrderDetailLogic(r.Context(), svcCtx)
		resp, err := l.GetOrderDetail(&req)
		result.HttpResult(r, w, resp, err)
	}
}
