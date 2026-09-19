package titanlogic

import (
	"context"
	"testing"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/stretchr/testify/assert"
)

func TestTestIntegrationDecryptFailureNotSuccess(t *testing.T) {
	// Config 内容非法（非 Hex 密文），解密必须失败且不再返回假成功
	m := &stubIntegrationModel{record: &model.TitanIntegration{
		Id:       1,
		Name:     "broken",
		Category: "unknown",
		Config:   "not-valid-hex-ciphertext",
	}}
	l := NewTestIntegrationLogic(context.Background(), &svc.ServiceContext{IntegrationModel: m})

	resp, err := l.TestIntegration(&titan.TestIntegrationReq{Id: 1})
	assert.NoError(t, err)
	assert.False(t, resp.Success, "解密失败不得返回假成功")
	assert.Contains(t, resp.Message, "解密失败")
}
