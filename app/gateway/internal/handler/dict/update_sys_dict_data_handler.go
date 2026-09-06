package dict

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/dict"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// 更新字典数据项
func UpdateSysDictDataHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.UpdateSysDictDataReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := dict.NewUpdateSysDictDataLogic(r.Context(), svcCtx)
		resp, err := l.UpdateSysDictData(&req)
		result.HttpResult(r, w, resp, err)
	}
}
