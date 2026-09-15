package config

import (
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/zrpc"
	"go-zero-boilerplate/pkg/storage"
	"go-zero-boilerplate/pkg/temporalx"
)

type Config struct {
	rest.RestConf

	// OpenAPI 契约文件配置
	OpenApi struct {
		FilePath string
	}

	// JWT 鉴权配置
	Auth struct {
		AccessSecret string
		AccessExpire int64
	}

	// Redis 缓存配置 (用于在线会话与 Token 黑名单)
	Redis redis.RedisConf

	// 下游微服务的 gRPC 客户端配置
	UserRpc   zrpc.RpcClientConf
	WorkerRpc zrpc.RpcClientConf

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

	// Temporal 分布式工作流配置
	Temporal temporalx.Config
}
