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
	Guard      GuardConf        `json:",optional"`
	ItsmRpc    zrpc.RpcClientConf `json:",optional"`
}

// GuardConf 出站安全防护配置
type GuardConf struct {
	// AllowPrivateNetwork 放行私有网段目标（企业集成服务/集群 API 常驻内网时开启）。
	// 环回、链路本地（云元数据 169.254.169.254 等）地址无论开关如何始终拒绝。
	AllowPrivateNetwork bool `json:",default=false"`
}
