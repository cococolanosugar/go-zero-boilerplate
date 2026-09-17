package k8s

import (
	"context"
	"testing"

	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"
)

func TestClusterManagerOperations(t *testing.T) {
	fakeClient := fake.NewSimpleClientset()
	ctx := context.Background()

	cm := NewFakeClusterManager(fakeClient, nil, fakeClient.Discovery())

	// 1. Test EnsureNamespace
	err := cm.EnsureNamespace(ctx, "devops-test")
	if err != nil {
		t.Fatalf("EnsureNamespace failed: %v", err)
	}

	// 2. Test ListNamespaces
	namespaces, err := cm.ListNamespaces(ctx)
	if err != nil {
		t.Fatalf("ListNamespaces failed: %v", err)
	}

	found := false
	for _, ns := range namespaces {
		if ns == "devops-test" {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected namespace devops-test in %v", namespaces)
	}

	// 3. Test CheckDeploymentReady
	replicas := int32(2)
	deploy := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "order-service",
			Namespace: "devops-test",
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
		},
		Status: appsv1.DeploymentStatus{
			ReadyReplicas: 2,
		},
	}

	_, err = fakeClient.AppsV1().Deployments("devops-test").Create(ctx, deploy, metav1.CreateOptions{})
	if err != nil {
		t.Fatalf("Create deployment failed: %v", err)
	}

	ready, msg, err := cm.CheckDeploymentReady(ctx, "devops-test", "order-service")
	if err != nil {
		t.Fatalf("CheckDeploymentReady failed: %v", err)
	}
	if !ready || msg != "Ready 2/2" {
		t.Fatalf("expected Ready 2/2, got ready=%v msg=%s", ready, msg)
	}
}

func TestBuildConfigFromKubeconfig(t *testing.T) {
	// Empty config check
	_, err := BuildConfigFromKubeconfig("")
	if err == nil {
		t.Fatalf("expected error for empty kubeconfig")
	}

	// Valid format check
	validKubeconfig := `
apiVersion: v1
clusters:
- cluster:
    server: https://127.0.0.1:6443
  name: local-cluster
contexts:
- context:
    cluster: local-cluster
    user: local-user
  name: local-context
current-context: local-context
kind: Config
preferences: {}
users:
- name: local-user
  user:
    token: fake-token
`
	cfg, err := BuildConfigFromKubeconfig(validKubeconfig)
	if err != nil {
		t.Fatalf("BuildConfigFromKubeconfig failed: %v", err)
	}
	if cfg.Host != "https://127.0.0.1:6443" {
		t.Fatalf("expected host https://127.0.0.1:6443, got %s", cfg.Host)
	}
}
