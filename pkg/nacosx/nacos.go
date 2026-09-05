package nacosx

import (
	"os"
	"path/filepath"

	"github.com/nacos-group/nacos-sdk-go/v2/common/constant"
	"github.com/zeromicro/zero-contrib/zrpc/registry/nacos"
)

// NacosConf nacos 注册中心配置
type NacosConf struct {
	Host                string  `json:",optional"`
	Port                uint64  `json:",default=8848"`
	NamespaceId         string  `json:",default=public"`
	TimeoutMs           uint64  `json:",default=5000"`
	NotLoadCacheAtStart bool    `json:",default=true"`
	LogDir              string  `json:",optional"`
	CacheDir            string  `json:",optional"`
	LogLevel            string  `json:",default=warn"`
	Group               string  `json:",optional"`
	Cluster             string  `json:",optional"`
	Weight              float64 `json:",optional"`
}

// RegisterService 统一向 Nacos 注册中心注册当前 gRPC 服务
// 若未配置 Nacos Host 则安全跳过（支持直连或走 Etcd 等其他模式）
func RegisterService(serviceName, listenOn string, conf NacosConf) error {
	if conf.Host == "" {
		return nil
	}

	sc := []constant.ServerConfig{
		*constant.NewServerConfig(conf.Host, conf.Port),
	}

	logDir := conf.LogDir
	if logDir == "" {
		logDir = filepath.Join(os.TempDir(), "nacos", "log")
	}
	cacheDir := conf.CacheDir
	if cacheDir == "" {
		cacheDir = filepath.Join(os.TempDir(), "nacos", "cache")
	}
	timeoutMs := conf.TimeoutMs
	if timeoutMs == 0 {
		timeoutMs = 5000
	}
	logLevel := conf.LogLevel
	if logLevel == "" {
		logLevel = "warn"
	}
	namespaceId := conf.NamespaceId
	if namespaceId == "" {
		namespaceId = "public"
	}

	cc := &constant.ClientConfig{
		NamespaceId:         namespaceId,
		TimeoutMs:           timeoutMs,
		NotLoadCacheAtStart: conf.NotLoadCacheAtStart,
		LogDir:              logDir,
		CacheDir:            cacheDir,
		LogLevel:            logLevel,
	}

	var opts []nacos.Option
	if conf.Group != "" {
		opts = append(opts, nacos.WithGroup(conf.Group))
	}
	if conf.Cluster != "" {
		opts = append(opts, nacos.WithCluster(conf.Cluster))
	}
	if conf.Weight > 0 {
		opts = append(opts, nacos.WithWeight(conf.Weight))
	}

	nacosOpts := nacos.NewNacosConfig(serviceName, listenOn, sc, cc, opts...)
	return nacos.RegisterService(nacosOpts)
}
