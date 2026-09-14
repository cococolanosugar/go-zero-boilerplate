// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package itsm

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/itsm"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/pkg/result"
)

func ListSlaPoliciesHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := itsm.NewListSlaPoliciesLogic(r.Context(), svcCtx)
		resp, err := l.ListSlaPolicies()
		result.HttpResult(r, w, resp, err)
	}
}
