package titanlogic

import (
	"testing"

	"go-zero-boilerplate/pkg/cryptox"

	"github.com/stretchr/testify/assert"
)

func encryptForTest(plain string) (string, error) {
	return cryptox.Encrypt(plain, "")
}

func TestIsSensitiveKey(t *testing.T) {
	// 常见敏感 key（大小写不敏感）
	for _, k := range []string{"token", "apiToken", "apiKey", "API_KEY", "secret", "clientSecret",
		"password", "passwd", "credentials", "private_key", "privateKey", "accessKey"} {
		assert.True(t, isSensitiveKey(k), "key %q 应被识别为敏感", k)
	}
	// 非敏感 key
	for _, k := range []string{"url", "serverAddr", "namespace", "group", "contextPath", "appId"} {
		assert.False(t, isSensitiveKey(k), "key %q 不应被识别为敏感", k)
	}
}

func TestIsMaskedValue(t *testing.T) {
	assert.True(t, isMaskedValue("****abcd"))
	assert.True(t, isMaskedValue("****"))
	assert.False(t, isMaskedValue("glpat-real-token"))
	assert.False(t, isMaskedValue(""))
}

func TestMaskConfig(t *testing.T) {
	// 加密→脱敏 roundtrip：所有敏感 key（含漏网命名）被掩码
	plain := `{"url":"https://gitlab.company.internal","apiToken":"real-token-value","apiKey":"another-secret","namespace":"public"}`
	cipher, err := encryptForTest(plain)
	assert.NoError(t, err)

	masked, err := maskConfig(cipher)
	assert.NoError(t, err)
	assert.Contains(t, masked, "https://gitlab.company.internal", "非敏感字段保留")
	assert.NotContains(t, masked, "real-token-value", "apiToken 必须被掩码")
	assert.NotContains(t, masked, "another-secret", "apiKey 必须被掩码")
	assert.Contains(t, masked, "****", "掩码格式")

	// 解密失败：返回错误而非密文原文
	_, err = maskConfig("not-hex-cipher")
	assert.Error(t, err)
}
