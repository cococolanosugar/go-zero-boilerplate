package titanlogic

import (
	"context"
	"testing"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/pkg/cryptox"

	"github.com/stretchr/testify/assert"
)

func TestPingLogic(t *testing.T) {
	ctx := context.Background()
	l := NewPingLogic(ctx, &svc.ServiceContext{})

	resp, err := l.Ping(&titan.PingReq{})
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, "pong", resp.Pong)
}

func TestCryptoxMaskSecret(t *testing.T) {
	testCases := []struct {
		input    string
		expected string
	}{
		{"", "******"},
		{"abc", "******"},
		{"abcdef", "ab**ef"},
		{"glpat-1234567890abcdef", "glpa****************def"},
	}

	for _, tc := range testCases {
		res := cryptox.MaskSecret(tc.input)
		assert.NotEmpty(t, res)
	}
}
