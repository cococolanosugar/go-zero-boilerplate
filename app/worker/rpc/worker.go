package main

import (
	"flag"
	"fmt"

	"go-zero-boilerplate/app/worker/rpc/internal/config"
	workerServer "go-zero-boilerplate/app/worker/rpc/internal/server/worker"
	"go-zero-boilerplate/app/worker/rpc/internal/svc"
	"go-zero-boilerplate/app/worker/rpc/pb"
	"go-zero-boilerplate/pkg/nacosx"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/service"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

var configFile = flag.String("f", "etc/worker.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)
	ctx := svc.NewServiceContext(c)

	s := zrpc.MustNewServer(c.RpcServerConf, func(grpcServer *grpc.Server) {
		pb.RegisterWorkerServer(grpcServer, workerServer.NewWorkerServer(ctx))

		if c.Mode == service.DevMode || c.Mode == service.TestMode {
			reflection.Register(grpcServer)
		}
	})

	// 注册服务至 Nacos 注册中心（若配置了 Nacos）
	if c.Nacos.Host != "" {
		if err := nacosx.RegisterService(c.Name, c.ListenOn, c.Nacos); err != nil {
			logx.Errorf("register service [%s] to nacos error: %v", c.Name, err)
		} else {
			logx.Infof("successfully registered service [%s] to nacos %s:%d", c.Name, c.Nacos.Host, c.Nacos.Port)
		}
	}

	// 统一由 ServiceGroup 管理 gRPC 服务与 Temporal Worker 生命周期
	group := service.NewServiceGroup()
	group.Add(s)
	group.Add(ctx.TemporalWorkerService)
	defer group.Stop()

	fmt.Printf("Starting worker rpc server at %s...\n", c.ListenOn)
	group.Start()
}

