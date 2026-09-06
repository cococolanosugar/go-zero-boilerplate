package dict

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/dict"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// 删除字典数据项
func DeleteSysDictDataHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.SysIdReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := dict.NewDeleteSysDictDataLogic(r.Context(), svcCtx)
		resp, err := l.DeleteSysDictData(&req)
		result.HttpResult(r, w, resp, err)
	}
}
