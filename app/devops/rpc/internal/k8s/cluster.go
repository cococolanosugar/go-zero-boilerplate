package k8s

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	yamlutil "k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/restmapper"
	"k8s.io/client-go/tools/clientcmd"
)

type ClusterManager struct {
	RestConfig      *rest.Config
	ClientSet       kubernetes.Interface
	DynamicClient   dynamic.Interface
	DiscoveryClient discovery.DiscoveryInterface
}

// BuildConfigFromKubeconfig 解析 Kubeconfig 文本并构建 rest.Config
func BuildConfigFromKubeconfig(kubeconfigText string) (*rest.Config, error) {
	trimmed := strings.TrimSpace(kubeconfigText)
	if trimmed == "" {
		return nil, errors.New("kubeconfig cannot be empty")
	}

	config, err := clientcmd.RESTConfigFromKubeConfig([]byte(trimmed))
	if err != nil {
		return nil, fmt.Errorf("failed to parse kubeconfig: %w", err)
	}
	config.Timeout = 15 * time.Second
	return config, nil
}

// NewClusterManager 创建集群治理管理客户端
func NewClusterManager(cfg *rest.Config) (*ClusterManager, error) {
	clientset, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes clientset: %w", err)
	}

	dynClient, err := dynamic.NewForConfig(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %w", err)
	}

	return &ClusterManager{
		RestConfig:      cfg,
		ClientSet:       clientset,
		DynamicClient:   dynClient,
		DiscoveryClient: clientset.Discovery(),
	}, nil
}

// TestConnection 测试集群连接并返回 Server 版本
func (m *ClusterManager) TestConnection(ctx context.Context) (string, error) {
	serverVersion, err := m.DiscoveryClient.ServerVersion()
	if err != nil {
		return "", fmt.Errorf("failed to get cluster server version: %w", err)
	}
	return serverVersion.GitVersion, nil
}

// ListNamespaces 列出集群所有命名空间
func (m *ClusterManager) ListNamespaces(ctx context.Context) ([]string, error) {
	nsList, err := m.ClientSet.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list namespaces: %w", err)
	}

	var names []string
	for _, ns := range nsList.Items {
		names = append(names, ns.Name)
	}
	return names, nil
}

// ApplyYaml 执行 Kubernetes YAML Manifest 原生 Server-Side Apply
func (m *ClusterManager) ApplyYaml(ctx context.Context, targetNamespace string, yamlContent string, dryRun bool) ([]string, error) {
	if strings.TrimSpace(yamlContent) == "" {
		return nil, errors.New("yaml content cannot be empty")
	}

	groupResources, err := restmapper.GetAPIGroupResources(m.DiscoveryClient)
	if err != nil {
		return nil, fmt.Errorf("failed to get API group resources: %w", err)
	}
	mapper := restmapper.NewDiscoveryRESTMapper(groupResources)

	var appliedResources []string
	decoder := yamlutil.NewYAMLOrJSONDecoder(bytes.NewReader([]byte(yamlContent)), 4096)

	for {
		var rawObj unstructured.Unstructured
		err := decoder.Decode(&rawObj)
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return appliedResources, fmt.Errorf("failed to decode yaml object: %w", err)
		}
		if len(rawObj.Object) == 0 {
			continue
		}

		gvk := rawObj.GroupVersionKind()
		mapping, err := mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
		if err != nil {
			return appliedResources, fmt.Errorf("failed to find REST mapping for GVK %s: %w", gvk.String(), err)
		}

		var dr dynamic.ResourceInterface
		if mapping.Scope.Name() == "namespace" {
			ns := rawObj.GetNamespace()
			if ns == "" {
				ns = targetNamespace
				rawObj.SetNamespace(ns)
			}
			dr = m.DynamicClient.Resource(mapping.Resource).Namespace(ns)
		} else {
			dr = m.DynamicClient.Resource(mapping.Resource)
		}

		data, err := rawObj.MarshalJSON()
		if err != nil {
			return appliedResources, fmt.Errorf("failed to marshal object JSON: %w", err)
		}

		patchOptions := metav1.PatchOptions{
			FieldManager: "titan-devops",
			Force:        &[]bool{true}[0],
		}
		if dryRun {
			patchOptions.DryRun = []string{metav1.DryRunAll}
		}

		name := rawObj.GetName()
		_, err = dr.Patch(ctx, name, types.ApplyPatchType, data, patchOptions)
		if err != nil {
			return appliedResources, fmt.Errorf("failed to apply %s/%s (%s): %w", rawObj.GetNamespace(), name, gvk.Kind, err)
		}

		appliedResources = append(appliedResources, fmt.Sprintf("%s/%s (%s)", rawObj.GetNamespace(), name, gvk.Kind))
	}

	return appliedResources, nil
}

// CheckDeploymentReady 检查 Deployment 工作负载就绪度
func (m *ClusterManager) CheckDeploymentReady(ctx context.Context, namespace, deploymentName string) (bool, string, error) {
	deploy, err := m.ClientSet.AppsV1().Deployments(namespace).Get(ctx, deploymentName, metav1.GetOptions{})
	if err != nil {
		return false, "", err
	}

	desired := int32(1)
	if deploy.Spec.Replicas != nil {
		desired = *deploy.Spec.Replicas
	}
	ready := deploy.Status.ReadyReplicas

	if ready >= desired {
		return true, fmt.Sprintf("Ready %d/%d", ready, desired), nil
	}
	return false, fmt.Sprintf("Progressing %d/%d ready", ready, desired), nil
}

// EnsureNamespace 确保命名空间存在
func (m *ClusterManager) EnsureNamespace(ctx context.Context, namespace string) error {
	_, err := m.ClientSet.CoreV1().Namespaces().Get(ctx, namespace, metav1.GetOptions{})
	if err == nil {
		return nil
	}

	ns := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: namespace,
		},
	}
	_, err = m.ClientSet.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{})
	return err
}

// FakeClusterManager 供单元测试使用的模拟实例生成函数
func NewFakeClusterManager(client kubernetes.Interface, dyn dynamic.Interface, disc discovery.DiscoveryInterface) *ClusterManager {
	return &ClusterManager{
		ClientSet:       client,
		DynamicClient:   dyn,
		DiscoveryClient: disc,
	}
}

// GVR Helper
func GVR(group, version, resource string) schema.GroupVersionResource {
	return schema.GroupVersionResource{Group: group, Version: version, Resource: resource}
}
