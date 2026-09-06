package dict

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/dict"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// 根据字典类型查询数据项列表
func GetDictDataByTypeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.GetDictDataByTypeReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := dict.NewGetDictDataByTypeLogic(r.Context(), svcCtx)
		resp, err := l.GetDictDataByType(&req)
		result.HttpResult(r, w, resp, err)
	}
}
