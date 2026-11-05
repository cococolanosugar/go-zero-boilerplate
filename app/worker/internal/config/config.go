package config

import (
	"go-zero-boilerplate/pkg/nacosx"
	"go-zero-boilerplate/pkg/temporalx"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/zrpc"
)

type Config struct {
	zrpc.RpcServerConf
	DataSource string
	Cache      cache.CacheConf
	Temporal   temporalx.Config
	Nacos      nacosx.NacosConf
}
