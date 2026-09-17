package main

import (
	"flag"
	"fmt"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/devops/rpc/internal/config"
	devopsServer "go-zero-boilerplate/app/devops/rpc/internal/server/devops"
	"go-zero-boilerplate/app/devops/rpc/internal/svc"
	"go-zero-boilerplate/pkg/nacosx"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/service"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	_ "github.com/go-sql-driver/mysql"
)

var configFile = flag.String("f", "etc/devops.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)
	ctx := svc.NewServiceContext(c)

	s := zrpc.MustNewServer(c.RpcServerConf, func(grpcServer *grpc.Server) {
		devops.RegisterDevopsServer(grpcServer, devopsServer.NewDevopsServer(ctx))

		if c.Mode == service.DevMode || c.Mode == service.TestMode {
			reflection.Register(grpcServer)
		}
	})
	defer s.Stop()

	// 注册服务至 Nacos (可选配置)
	if c.Nacos.Host != "" {
		_ = nacosx.RegisterService(c.Name, c.ListenOn, c.Nacos)
	}

	fmt.Printf("Starting Titan DevOps rpc server at %s...\n", c.ListenOn)
	s.Start()
}
