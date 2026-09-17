package k8s

import (
	"bytes"
	"fmt"
	"text/template"
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
