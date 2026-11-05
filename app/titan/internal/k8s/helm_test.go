package k8s

import (
	"strings"
	"testing"
)

func TestRenderYamlTemplate(t *testing.T) {
	tpl := `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .ServiceName }}
  namespace: {{ .Namespace }}
spec:
  replicas: {{ .Replicas }}
  template:
    spec:
      containers:
      - name: {{ .ServiceName }}
        image: {{ .Image }}
`
	params := map[string]interface{}{
		"ServiceName": "order-service",
		"Namespace":   "prod",
		"Replicas":    3,
		"Image":       "registry.local/order:v1.2.3",
	}

	rendered, err := RenderYamlTemplate(tpl, params)
	if err != nil {
		t.Fatalf("RenderYamlTemplate failed: %v", err)
	}

	if !strings.Contains(rendered, "name: order-service") {
		t.Fatalf("expected order-service in rendered output, got:\n%s", rendered)
	}
	if !strings.Contains(rendered, "image: registry.local/order:v1.2.3") {
		t.Fatalf("expected image in rendered output, got:\n%s", rendered)
	}
	if !strings.Contains(rendered, "replicas: 3") {
		t.Fatalf("expected replicas: 3 in rendered output, got:\n%s", rendered)
	}
}

func TestHelmMergeValues(t *testing.T) {
	engine := NewHelmEngine()
	baseYaml := `
replicaCount: 1
image:
  repository: nginx
  tag: stable
`
	overrides := map[string]interface{}{
		"replicaCount": 3,
		"image": map[string]interface{}{
			"repository": "my-nginx",
			"tag":        "v2.0",
		},
	}

	merged, err := engine.MergeValues(baseYaml, overrides)
	if err != nil {
		t.Fatalf("MergeValues failed: %v", err)
	}

	if merged["replicaCount"] != 3 {
		t.Fatalf("expected replicaCount=3, got %v", merged["replicaCount"])
	}
}
