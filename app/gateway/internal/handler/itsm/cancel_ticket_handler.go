// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package itsm

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	"go-zero-boilerplate/pkg/result"
	"go-zero-boilerplate/app/gateway/internal/logic/itsm"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
)

func CancelTicketHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CancelTicketReqVO
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := itsm.NewCancelTicketLogic(r.Context(), svcCtx)
		err := l.CancelTicket(&req)
		result.HttpResult(r, w, nil, err)
	}
}
