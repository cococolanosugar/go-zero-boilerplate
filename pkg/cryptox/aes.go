package cryptox

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"os"

	"github.com/zeromicro/go-zero/core/logx"
)

var (
	// DefaultDevKey 默认开发秘钥（仅限开发/测试环境回退，生产环境必须通过环境变量 TITAN_ENCRYPTION_KEY 覆盖）
	defaultKey = "titan-platform-secret-key"
	prodMode   bool
)

// Init 在服务启动时初始化加密模块的运行模式判定。
// mode 建议传入 go-zero 的 service.Mode（ProdMode / DevMode / TestMode）。
// 生产环境未配置 TITAN_ENCRYPTION_KEY 时直接 panic 拒绝启动，避免凭据静默回退到内置默认密钥；
// 开发与测试环境允许回退，但输出 WARN 提示。
func Init(mode string) {
	prodMode = mode == "prod" || mode == "production"
	if os.Getenv("TITAN_ENCRYPTION_KEY") == "" {
		if prodMode {
			panic("cryptox: 生产环境必须配置 TITAN_ENCRYPTION_KEY 环境变量 (用于 kubeconfig/集成凭据的 AES-256-GCM 加密), 拒绝以默认密钥启动")
		}
		logx.Errorf("cryptox: TITAN_ENCRYPTION_KEY 未配置, 开发模式回退到内置默认密钥, 生产部署前必须覆盖")
	}
}

// deriveKey 将任意长度的字符串通过 SHA-256 派生为固定的 32 字节 (256-bit) AES 秘钥
func deriveKey(key string) []byte {
	if key == "" {
		if envKey := os.Getenv("TITAN_ENCRYPTION_KEY"); envKey != "" {
			key = envKey
		} else {
			key = defaultKey
		}
	}
	hash := sha256.Sum256([]byte(key))
	return hash[:]
}

// Encrypt 使用 AES-256-GCM 算法加密明文字符串，返回带 Nonce 前缀的 Hex 密文
func Encrypt(plaintext string, key string) (string, error) {
	if plaintext == "" {
		return "", nil
	}

	block, err := aes.NewCipher(deriveKey(key))
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return hex.EncodeToString(ciphertext), nil
}

// Decrypt 使用 AES-256-GCM 算法解密 Hex 密文，还原原始明文字符串
func Decrypt(ciphertextHex string, key string) (string, error) {
	if ciphertextHex == "" {
		return "", nil
	}

	data, err := hex.DecodeString(ciphertextHex)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(deriveKey(key))
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// MaskSecret 将敏感凭证（如 Token、密码、私钥）进行掩码脱敏，仅保留前后字符
func MaskSecret(secret string) string {
	if len(secret) <= 6 {
		return "******"
	}
	prefix := secret[:3]
	suffix := secret[len(secret)-3:]
	return prefix + "******" + suffix
}
