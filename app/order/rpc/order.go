package main

import (
	"flag"
	"fmt"

	"go-zero-boilerplate/app/order/rpc/internal/config"
	orderServer "go-zero-boilerplate/app/order/rpc/internal/server/order"
	"go-zero-boilerplate/app/order/rpc/internal/svc"
	"go-zero-boilerplate/app/order/rpc/pb"
	"go-zero-boilerplate/pkg/nacosx"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/service"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	_ "github.com/go-sql-driver/mysql"
)

var configFile = flag.String("f", "etc/order.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)
	ctx := svc.NewServiceContext(c)

	s := zrpc.MustNewServer(c.RpcServerConf, func(grpcServer *grpc.Server) {
		pb.RegisterOrderServer(grpcServer, orderServer.NewOrderServer(ctx))

		if c.Mode == service.DevMode || c.Mode == service.TestMode {
			reflection.Register(grpcServer)
		}
	})
	defer s.Stop()

	// 注册服务至 Nacos 注册中心（若配置了 Nacos）
	if c.Nacos.Host != "" {
		if err := nacosx.RegisterService(c.Name, c.ListenOn, c.Nacos); err != nil {
			logx.Errorf("register service [%s] to nacos error: %v", c.Name, err)
		} else {
			logx.Infof("successfully registered service [%s] to nacos %s:%d", c.Name, c.Nacos.Host, c.Nacos.Port)
		}
	}

	fmt.Printf("Starting rpc server at %s...\n", c.ListenOn)
	s.Start()
}
