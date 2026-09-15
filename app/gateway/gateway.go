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
	"go-zero-boilerplate/pkg/session"

	"net/http"
	"os"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/rest"

	_ "github.com/zeromicro/zero-contrib/zrpc/registry/nacos"
)

var configFile = flag.String("f", "etc/gateway.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)
	openApiSpecBytes, err := os.ReadFile(c.OpenApi.FilePath)
	if err != nil {
		panic(fmt.Errorf("failed to load OpenAPI spec from %s: %w", c.OpenApi.FilePath, err))
	}

	// 挂载静态文件目录服务（支持 /uploads/* 访问本地上传资源）
	uploadPrefix := strings.TrimRight(c.Storage.BaseUrl, "/") + "/"
	if uploadPrefix == "/" {
		uploadPrefix = "/uploads/"
	}
	basePath := c.Storage.BasePath
	if basePath == "" {
		basePath = "./data/uploads"
	}
	_ = os.MkdirAll(basePath, 0755)
	fileServer := http.StripPrefix(uploadPrefix, http.FileServer(http.Dir(basePath)))

	server := rest.MustNewServer(c.RestConf, rest.WithNotFoundHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, uploadPrefix) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			fileServer.ServeHTTP(w, r)
			return
		}
		http.NotFound(w, r)
	})))
	defer server.Stop()

	ctx := svc.NewServiceContext(c)
	ctx.OpenApiSpecBytes = openApiSpecBytes

	// 提供无需鉴权的内存 OpenAPI 契约接口
	server.AddRoute(rest.Route{
		Method: http.MethodGet,
		Path:   "/openapi.json",
		Handler: func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(ctx.OpenApiSpecBytes)
		},
	})

	// 启用请求上下文注入中间件（注入真实客户端 IP 与 User-Agent 供在线会话与审计分析）
	server.Use(func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			r = r.WithContext(session.WithRequestInfo(r.Context(), r))
			next(w, r)
		}
	})

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
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Idempotency-Key, Repeat-Submit-Token, X-Repeat-Submit-Interval")
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

	// 挂载业务数据防重复提交与幂等控制切面中间件（秒级防刷与连击拦截）
	server.Use(middleware.NewAntiRepeatMiddleware(ctx).Handle)

	// 挂载企业级操作审计日志中间件（异步记录增删改操作）
	server.Use(middleware.NewOperLogMiddleware(ctx).Handle)

	// 挂载网关动态 RBAC 接口拦截中间件（403 权限拒绝与角色白名单判定）
	server.Use(middleware.NewRbacMiddleware(ctx).Handle)

	handler.RegisterHandlers(server, ctx)

	// 注册网关 SSE 实时通知流通道
	server.AddRoute(rest.Route{
		Method: http.MethodGet,
		Path:   "/api/v1/system/notice/stream",
		Handler: func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/event-stream")
			w.Header().Set("Cache-Control", "no-cache")
			w.Header().Set("Connection", "keep-alive")
			w.Header().Set("Access-Control-Allow-Origin", "*")

			flusher, ok := w.(http.Flusher)
			if !ok {
				http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
				return
			}

			// 发送初始握手与就绪通知
			initMsg := `{"type":"notice","id":"init-01","title":"微服务网关 SSE 实时通知通道已就绪","datetime":"刚刚","category":"notification","status":"success"}`
			fmt.Fprintf(w, "data: %s\n\n", initMsg)
			flusher.Flush()

			ticker := time.NewTicker(20 * time.Second)
			defer ticker.Stop()

			ctx := r.Context()
			for {
				select {
				case <-ctx.Done():
					return
				case t := <-ticker.C:
					pingMsg := fmt.Sprintf(`{"type":"heartbeat","time":"%s"}`, t.Format(time.RFC3339))
					fmt.Fprintf(w, "data: %s\n\n", pingMsg)
					flusher.Flush()
				}
			}
		},
	})

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
