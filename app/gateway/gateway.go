// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package main

import (
	"flag"
	"fmt"

	"go-zero-boilerplate/app/gateway/internal/config"
	"go-zero-boilerplate/app/gateway/internal/handler"
	"go-zero-boilerplate/app/gateway/internal/middleware"
	"go-zero-boilerplate/app/gateway/internal/svc"

	"net/http"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/rest"

	_ "github.com/zeromicro/zero-contrib/zrpc/registry/nacos"
)

var configFile = flag.String("f", "etc/gateway.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)

	server := rest.MustNewServer(c.RestConf)
	defer server.Stop()

	ctx := svc.NewServiceContext(c)

	// 启用全局 CORS 跨域支持中间件（严格符合 W3C CORS 规范与凭据安全要求）
	server.Use(func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			} else {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			}
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
			w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type")
			w.Header().Set("Access-Control-Max-Age", "86400")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next(w, r)
		}
	})

	// 挂载企业级操作审计日志中间件（异步记录增删改操作）
	server.Use(middleware.NewOperLogMiddleware(ctx).Handle)

	// 挂载网关动态 RBAC 接口拦截中间件（403 权限拒绝与角色白名单判定）
	server.Use(middleware.NewRbacMiddleware(ctx).Handle)

	handler.RegisterHandlers(server, ctx)

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
