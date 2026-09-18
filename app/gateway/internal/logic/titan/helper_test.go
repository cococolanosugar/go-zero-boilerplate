package titan

import (
	"context"
	"encoding/json"
	"testing"

	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/stretchr/testify/assert"
)

func TestGetUserIdFromCtx(t *testing.T) {
	ctxEmpty := context.Background()
	assert.Equal(t, int64(0), getUserIdFromCtx(ctxEmpty))

	ctxWithInt := context.WithValue(context.Background(), "userId", int64(42))
	assert.Equal(t, int64(42), getUserIdFromCtx(ctxWithInt))

	ctxWithJsonNum := context.WithValue(context.Background(), "userId", json.Number("10086"))
	assert.Equal(t, int64(10086), getUserIdFromCtx(ctxWithJsonNum))
}

func TestMappers(t *testing.T) {
	clusterItem := &titan.ClusterItem{
		Id:          1,
		Name:        "test-cluster",
		Env:         "test",
		ApiEndpoint: "https://k8s.local:6443",
		Status:      "HEALTHY",
		Version:     "v1.31.0",
		Description: "test desc",
	}
	clusterVO := toClusterVO(clusterItem)
	assert.Equal(t, clusterItem.Id, clusterVO.Id)
	assert.Equal(t, clusterItem.Name, clusterVO.Name)
	assert.Equal(t, clusterItem.Env, clusterVO.Env)

	integrationItem := &titan.IntegrationItem{
		Id:       2,
		Name:     "jenkins-prod",
		Category: "JENKINS",
		AuthType: "BASIC",
	}
	integrationVO := toIntegrationVO(integrationItem)
	assert.Equal(t, integrationItem.Id, integrationVO.Id)
	assert.Equal(t, integrationItem.Name, integrationVO.Name)

	pipelineItem := &titan.PipelineItem{
		Id:          3,
		Name:        "order-ci",
		DisplayName: "Order CI",
		GitBranch:   "master",
	}
	pipelineVO := toPipelineVO(pipelineItem)
	assert.Equal(t, pipelineItem.Id, pipelineVO.Id)
	assert.Equal(t, pipelineItem.DisplayName, pipelineVO.DisplayName)

	execItem := &titan.ExecutionItem{
		Id:         4,
		PipelineId: 3,
		ExecNo:     "EXEC-20260918-001",
		Status:     "RUNNING",
	}
	execVO := toExecutionVO(execItem)
	assert.Equal(t, execItem.ExecNo, execVO.ExecNo)
	assert.Equal(t, execItem.Status, execVO.Status)

	stepItem := &titan.StepExecItem{
		Id:       5,
		ExecId:   4,
		StepName: "Checkout",
		Status:   "SUCCESS",
	}
	stepVO := toStepExecVO(stepItem)
	assert.Equal(t, stepItem.StepName, stepVO.StepName)
	assert.Equal(t, stepItem.Status, stepVO.Status)
}
