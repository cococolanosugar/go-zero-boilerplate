package result

import (
	"net/http"

	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// HttpResult 统一 HTTP 响应封装
func HttpResult(r *http.Request, w http.ResponseWriter, resp any, err error) {
	if err == nil {
		// 成功返回
		httpx.WriteJsonCtx(r.Context(), w, http.StatusOK, Success(resp))
		return
	}

	// 错误返回：自动支持本地 CodeError、包装 error 以及跨微服务 gRPC 业务错误码反解
	errCode, errMsg := xerr.FromError(err)

	logx.WithContext(r.Context()).Errorf("【API-ERR】: %+v", err)
	httpx.WriteJsonCtx(r.Context(), w, http.StatusOK, Error(errCode, errMsg))
}

// ParamErrorResult 参数解析错误返回
func ParamErrorResult(r *http.Request, w http.ResponseWriter, err error) {
	httpx.WriteJsonCtx(r.Context(), w, http.StatusBadRequest, Error(xerr.RequestParamError, err.Error()))
}
