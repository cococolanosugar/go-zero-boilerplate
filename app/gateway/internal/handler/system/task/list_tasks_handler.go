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

// 获取异步任务分页列表
func ListTasksHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ListTasksReq
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		l := task.NewListTasksLogic(r.Context(), svcCtx)
		resp, err := l.ListTasks(&req)
		result.HttpResult(r, w, resp, err)
	}
}
