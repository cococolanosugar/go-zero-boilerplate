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

func CreateTicketHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateTicketReqVO
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := itsm.NewCreateTicketLogic(r.Context(), svcCtx)
		resp, err := l.CreateTicket(&req)
		result.HttpResult(r, w, resp, err)
	}
}
