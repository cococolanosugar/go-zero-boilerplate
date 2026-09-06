package dict

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/dict"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// 创建字典类型
func CreateSysDictTypeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateSysDictTypeReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := dict.NewCreateSysDictTypeLogic(r.Context(), svcCtx)
		resp, err := l.CreateSysDictType(&req)
		result.HttpResult(r, w, resp, err)
	}
}
