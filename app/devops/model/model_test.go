package model

import (
	"testing"
)

func TestDevopsModelsInitialization(t *testing.T) {
	cluster := &DevopsCluster{
		Id:          1,
		Name:        "test-cluster",
		Env:         "dev",
		ApiEndpoint: "https://127.0.0.1:6443",
		Kubeconfig:  "dummy-kubeconfig",
		Status:      "HEALTHY",
		Version:     "v1.28.0",
	}
	if cluster.Name != "test-cluster" || cluster.Env != "dev" {
		t.Fatalf("unexpected cluster values: %+v", cluster)
	}

	integration := &DevopsIntegration{
		Id:       1,
		Name:     "jenkins-main",
		Category: "jenkins",
		AuthType: "token",
		Config:   `{"url":"http://jenkins:8080"}`,
		Status:   1,
	}
	if integration.Category != "jenkins" || integration.Status != 1 {
		t.Fatalf("unexpected integration values: %+v", integration)
	}

	pipeline := &DevopsPipeline{
		Id:          1,
		Name:        "portal-ci",
		DisplayName: "官方门户发布流水线",
		Category:    "frontend",
		GitRepo:     "https://github.com/org/portal.git",
		GitBranch:   "main",
		Stages:      `[{"id":"build","name":"打包构建"}]`,
		Params:      `[]`,
		Triggers:    `{"webhook":true}`,
		Status:      1,
	}
	if pipeline.DisplayName != "官方门户发布流水线" {
		t.Fatalf("unexpected pipeline values: %+v", pipeline)
	}

	exec := &DevopsPipelineExec{
		Id:           1,
		PipelineId:   1,
		PipelineName: "portal-ci",
		ExecNo:       "TITAN-20260918-0001",
		TriggerType:  "MANUAL",
		TriggerBy:    1,
		GitBranch:    "main",
		GitCommit:    "abc1234",
		Status:       "RUNNING",
		WorkflowId:   "titan-wf-1001",
		Artifacts:    `["portal:v1.0.0"]`,
	}
	if exec.ExecNo != "TITAN-20260918-0001" || exec.Status != "RUNNING" {
		t.Fatalf("unexpected exec values: %+v", exec)
	}

	stepExec := &DevopsPipelineStepExec{
		Id:        1,
		ExecId:    1,
		StageId:   "build",
		StepId:    "kaniko-build",
		StepName:  "Kaniko 镜像构建",
		StepType:  "KANIKO_BUILD",
		Status:    "PENDING",
		LogPath:   "/logs/titan/step-1.log",
		ErrorMsg:  "",
	}
	if stepExec.StepType != "KANIKO_BUILD" {
		t.Fatalf("unexpected step exec values: %+v", stepExec)
	}
}
