package main

import (
	"flag"
	"fmt"

	"go-zero-boilerplate/app/itsm/rpc/internal/config"
	itsmServer "go-zero-boilerplate/app/itsm/rpc/internal/server/itsm"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"
	"go-zero-boilerplate/pkg/nacosx"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/service"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	_ "github.com/go-sql-driver/mysql"
)

var configFile = flag.String("f", "etc/itsm.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)
	ctx := svc.NewServiceContext(c)

	s := zrpc.MustNewServer(c.RpcServerConf, func(grpcServer *grpc.Server) {
		itsm.RegisterItsmServer(grpcServer, itsmServer.NewItsmServer(ctx))

		if c.Mode == service.DevMode || c.Mode == service.TestMode {
			reflection.Register(grpcServer)
		}
	})
	defer s.Stop()

	// 注册服务至 Nacos (可选配置)
	if c.Nacos.Host != "" {
		_ = nacosx.RegisterService(c.Name, c.ListenOn, c.Nacos)
	}

	fmt.Printf("Starting ITSM rpc server at %s...\n", c.ListenOn)
	s.Start()
}
