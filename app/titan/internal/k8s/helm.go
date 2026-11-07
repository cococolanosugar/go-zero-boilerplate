package k8s

import (
	"context"
	"fmt"
	"time"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	chartloader "helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/release"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/discovery/cached/memory"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/restmapper"
	"k8s.io/client-go/tools/clientcmd"
	"sigs.k8s.io/yaml"
)

// RESTClientGetterImpl 适配 Helm 对 RESTClientGetter 接口的要求
type RESTClientGetterImpl struct {
	restConfig *rest.Config
	namespace  string
}

func NewRESTClientGetter(cfg *rest.Config, ns string) *RESTClientGetterImpl {
	return &RESTClientGetterImpl{
		restConfig: cfg,
		namespace:  ns,
	}
}

func (r *RESTClientGetterImpl) ToRESTConfig() (*rest.Config, error) {
	return r.restConfig, nil
}

func (r *RESTClientGetterImpl) ToDiscoveryClient() (discovery.CachedDiscoveryInterface, error) {
	config, err := r.ToRESTConfig()
	if err != nil {
		return nil, err
	}
	discoveryClient, err := discovery.NewDiscoveryClientForConfig(config)
	if err != nil {
		return nil, err
	}
	return memory.NewMemCacheClient(discoveryClient), nil
}

func (r *RESTClientGetterImpl) ToRESTMapper() (meta.RESTMapper, error) {
	discoveryClient, err := r.ToDiscoveryClient()
	if err != nil {
		return nil, err
	}
	mapper := restmapper.NewDeferredDiscoveryRESTMapper(discoveryClient)
	return mapper, nil
}

func (r *RESTClientGetterImpl) ToRawKubeConfigLoader() clientcmd.ClientConfig {
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	configOverrides := &clientcmd.ConfigOverrides{}
	if r.namespace != "" {
		configOverrides.Context.Namespace = r.namespace
	}
	return clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, configOverrides)
}

type HelmReleaseOptions struct {
	ReleaseName string
	Namespace   string
	ChartPath   string
	Values      map[string]interface{}
	Timeout     time.Duration
	DryRun      bool
}

type HelmEngine struct {
	settings *cli.EnvSettings
}

func NewHelmEngine() *HelmEngine {
	return &HelmEngine{
		settings: cli.New(),
	}
}

// MergeValues 将 YAML 原始文本与结构化覆盖参数深度合并
func (h *HelmEngine) MergeValues(baseValuesYaml string, overrides map[string]interface{}) (map[string]interface{}, error) {
	baseMap := make(map[string]interface{})
	if baseValuesYaml != "" {
		if err := yaml.Unmarshal([]byte(baseValuesYaml), &baseMap); err != nil {
			return nil, fmt.Errorf("failed to unmarshal base values: %w", err)
		}
	}

	for k, v := range overrides {
		baseMap[k] = v
	}
	return baseMap, nil
}

// UpgradeInstall 执行 helm upgrade --install 发布微服务 Chart
func (h *HelmEngine) UpgradeInstall(ctx context.Context, restConfig *rest.Config, opts HelmReleaseOptions) (*release.Release, error) {
	clientGetter := NewRESTClientGetter(restConfig, opts.Namespace)
	actionConfig := new(action.Configuration)
	if err := actionConfig.Init(clientGetter, opts.Namespace, "secret", func(format string, v ...interface{}) {}); err != nil {
		return nil, fmt.Errorf("failed to init helm action config: %w", err)
	}

	client := action.NewUpgrade(actionConfig)
	client.Namespace = opts.Namespace
	client.Install = true
	client.Wait = !opts.DryRun
	client.Timeout = opts.Timeout
	if client.Timeout == 0 {
		client.Timeout = 5 * time.Minute
	}
	client.DryRun = opts.DryRun

	var ch *chart.Chart
	var err error
	if opts.ChartPath != "" {
		ch, err = chartloader.Load(opts.ChartPath)
		if err != nil {
			return nil, fmt.Errorf("failed to load helm chart from %s: %w", opts.ChartPath, err)
		}
	} else {
		// 创建空包装 Chart 容器（供仅有 manifests 或简单部署模板时使用）
		ch = &chart.Chart{
			Metadata: &chart.Metadata{
				Name:       opts.ReleaseName,
				Version:    "0.1.0",
				APIVersion: "v2",
			},
		}
	}

	rel, err := client.Run(opts.ReleaseName, ch, opts.Values)
	if err != nil {
		return nil, fmt.Errorf("helm upgrade --install %s failed: %w", opts.ReleaseName, err)
	}

	return rel, nil
}

// Rollback 回滚 Release 到指定 Revision 版本
func (h *HelmEngine) Rollback(ctx context.Context, restConfig *rest.Config, namespace, releaseName string, revision int) error {
	clientGetter := NewRESTClientGetter(restConfig, namespace)
	actionConfig := new(action.Configuration)
	if err := actionConfig.Init(clientGetter, namespace, "secret", func(format string, v ...interface{}) {}); err != nil {
		return fmt.Errorf("failed to init helm action config: %w", err)
	}

	client := action.NewRollback(actionConfig)
	client.Version = revision
	client.Timeout = 5 * time.Minute
	client.Wait = true

	if err := client.Run(releaseName); err != nil {
		return fmt.Errorf("helm rollback %s to revision %d failed: %w", releaseName, revision, err)
	}
	return nil
}
