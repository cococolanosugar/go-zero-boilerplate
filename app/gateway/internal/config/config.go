package config

import (
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/zrpc"
	"go-zero-boilerplate/pkg/storage"
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

	// Casdoor SSO 认证配置
	Casdoor struct {
		Endpoint         string
		ClientId         string
		ClientSecret     string
		Certificate      string `json:",optional"`
		OrganizationName string
		ApplicationName  string
	}

	// 对象存储配置
	Storage storage.Config
}
