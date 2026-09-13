// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package task

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	"go-zero-boilerplate/app/gateway/internal/logic/system/task"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/result"
)

// 删除异步任务
func DeleteTaskHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.DeleteTaskReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := task.NewDeleteTaskLogic(r.Context(), svcCtx)
		resp, err := l.DeleteTask(&req)
		result.HttpResult(r, w, resp, err)
	}
}
