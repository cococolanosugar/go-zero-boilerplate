package config

import (
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/zrpc"
)

type Config struct {
	rest.RestConf

	// JWT 鉴权配置
	Auth struct {
		AccessSecret string
		AccessExpire int64
	}

	// 下游微服务的 gRPC 客户端配置
	UserRpc  zrpc.RpcClientConf
	OrderRpc zrpc.RpcClientConf
}
