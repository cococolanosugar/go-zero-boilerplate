package system

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/logic/system"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/pkg/result"
)

// 通用文件上传
func UploadFileHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := system.NewUploadFileLogic(r.Context(), svcCtx, r)
		resp, err := l.UploadFile()
		result.HttpResult(r, w, resp, err)
	}
}
