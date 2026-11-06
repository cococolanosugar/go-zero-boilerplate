// Code scaffolded by goctl. Safe to edit.
// goctl {{.version}}

package {{.PkgName}}

import (
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/perm"
	"go-zero-boilerplate/pkg/result"
	"github.com/zeromicro/go-zero/rest/httpx"
	{{.ImportPackages}}
)

{{if .HasDoc}}{{.Doc}}{{end}}
func {{.HandlerName}}(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if svcCtx.RbacService != nil {
			if err := svcCtx.RbacService.Check(r.Context(), perm.PermissionRequired{
				// 配置权限点: Permission / All / Any
			}); err != nil {
				result.HttpResult(r, w, nil, err)
				return
			}
		}

		{{if .HasRequest}}var req types.{{.RequestType}}
		if err := httpx.Parse(r, &req); err != nil {
			result.ParamErrorResult(r, w, err)
			return
		}

		{{end}}l := {{.LogicName}}.New{{.LogicType}}(r.Context(), svcCtx)
		{{if .HasResp}}resp, {{end}}err := l.{{.Call}}({{if .HasRequest}}&req{{end}})
		result.HttpResult(r, w, {{if .HasResp}}resp{{else}}nil{{end}}, err)
	}
}
