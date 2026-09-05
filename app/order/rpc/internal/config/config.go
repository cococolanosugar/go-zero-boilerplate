package config

import (
	"go-zero-boilerplate/pkg/nacosx"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/zrpc"
)

type Config struct {
	zrpc.RpcServerConf
	DataSource string
	Cache      cache.CacheConf
	Nacos      nacosx.NacosConf `json:",optional"`
}

