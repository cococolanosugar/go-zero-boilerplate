package titanlogic

import (
	"context"
	"testing"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/stretchr/testify/assert"
)

func TestGetDeliveryMatrix_InvalidProjectId(t *testing.T) {
	ctx := context.Background()
	l := NewGetDeliveryMatrixLogic(ctx, &svc.ServiceContext{})

	resp, err := l.GetDeliveryMatrix(&titan.GetDeliveryMatrixReq{
		ProjectId: 0,
	})
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "项目ID必须大于0")
}

func TestCompareMatrixEnv_InvalidParams(t *testing.T) {
	ctx := context.Background()
	l := NewCompareMatrixEnvLogic(ctx, &svc.ServiceContext{})

	// 校验项目与应用 ID
	resp, err := l.CompareMatrixEnv(&titan.CompareMatrixEnvReq{
		ProjectId: 0,
		AppId:     1,
		SourceEnv: "test",
		TargetEnv: "prod",
	})
	assert.Error(t, err)
	assert.Nil(t, resp)

	// 校验源环境与目标环境非空
	resp, err = l.CompareMatrixEnv(&titan.CompareMatrixEnvReq{
		ProjectId: 1,
		AppId:     1,
		SourceEnv: "",
		TargetEnv: "prod",
	})
	assert.Error(t, err)
	assert.Nil(t, resp)
}
