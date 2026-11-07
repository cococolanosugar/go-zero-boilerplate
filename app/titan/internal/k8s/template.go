package k8s

import (
	"bytes"
	"errors"
	"fmt"
	"strings"
	"text/template"

	k8syaml "sigs.k8s.io/yaml"
)

// RenderYamlTemplate 使用 Go 模板引擎渲染包含动态变量的 YAML 文本
func RenderYamlTemplate(tplContent string, params map[string]interface{}) (string, error) {
	if tplContent == "" {
		return "", nil
	}

	tpl, err := template.New("k8s-manifest").Option("missingkey=zero").Parse(tplContent)
	if err != nil {
		return "", fmt.Errorf("failed to parse yaml template: %w", err)
	}

	var buf bytes.Buffer
	if err := tpl.Execute(&buf, params); err != nil {
		return "", fmt.Errorf("failed to render yaml template: %w", err)
	}

	return buf.String(), nil
}

// allowedManifestKinds 渲染结果允许下发到集群的资源类型白名单：
// 恶意 deploy_spec/镜像名无法借模板注入逃逸出受控资源（如 ClusterRole、Namespace、CRD）
var allowedManifestKinds = map[string]bool{
	"Deployment":     true,
	"StatefulSet":    true,
	"DaemonSet":      true,
	"Service":        true,
	"ConfigMap":      true,
	"Secret":         true,
	"Ingress":        true,
	"Job":            true,
	"CronJob":        true,
	"ServiceAccount": true,
	"Role":           true,
	"RoleBinding":    true,
}

// ValidateRenderedManifest 校验渲染后的 YAML 仅包含白名单资源类型，
// 且不尝试越出目标命名空间（namespace 字段若显式指定必须与目标一致或为空）。
func ValidateRenderedManifest(yamlContent string, targetNamespace string) error {
	if strings.TrimSpace(yamlContent) == "" {
		return nil
	}

	docs := strings.Split(yamlContent, "\n---")
	for _, doc := range docs {
		trimmed := strings.TrimSpace(doc)
		if trimmed == "" {
			continue
		}
		var obj map[string]interface{}
		if err := k8syaml.Unmarshal([]byte(trimmed), &obj); err != nil {
			return fmt.Errorf("部署模板渲染结果不是合法的 K8s 资源清单: %w", err)
		}
		kind, _ := obj["kind"].(string)
		if kind == "" {
			return errors.New("部署模板渲染结果缺少 kind 字段")
		}
		if !allowedManifestKinds[kind] {
			return fmt.Errorf("部署模板渲染出不被允许的资源类型 %q", kind)
		}
		if meta, ok := obj["metadata"].(map[string]interface{}); ok {
			if ns, ok := meta["namespace"].(string); ok && ns != "" && ns != targetNamespace {
				return fmt.Errorf("部署模板试图下发到目标命名空间 %q 之外的命名空间 %q", targetNamespace, ns)
			}
		}
	}
	return nil
}
