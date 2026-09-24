package cryptox

import (
	"os"
	"strings"
	"testing"
)

// withKeyEnv 在受控环境下执行用例，结束后还原环境变量与包内状态
func withKeyEnv(t *testing.T, key string, fn func()) {
	t.Helper()
	old, had := os.LookupEnv("TITAN_ENCRYPTION_KEY")
	if key == "" {
		_ = os.Unsetenv("TITAN_ENCRYPTION_KEY")
	} else {
		_ = os.Setenv("TITAN_ENCRYPTION_KEY", key)
	}
	defer func() {
		if had {
			_ = os.Setenv("TITAN_ENCRYPTION_KEY", old)
		} else {
			_ = os.Unsetenv("TITAN_ENCRYPTION_KEY")
		}
		prodMode = false
	}()
	fn()
}

func TestInitProdWithoutKeyPanics(t *testing.T) {
	withKeyEnv(t, "", func() {
		defer func() {
			r := recover()
			if r == nil {
				t.Fatal("生产环境缺 TITAN_ENCRYPTION_KEY 应 panic 拒绝启动")
			}
			if !strings.Contains(r.(string), "TITAN_ENCRYPTION_KEY") {
				t.Fatalf("panic 信息应包含配置指引, got: %v", r)
			}
		}()
		Init("prod")
	})
}

func TestInitProdWithKeyOK(t *testing.T) {
	withKeyEnv(t, "unit-test-key", func() {
		Init("prod") // 不应 panic
		ct, err := Encrypt("kubeconfig-secret", "")
		if err != nil {
			t.Fatalf("encrypt: %v", err)
		}
		pt, err := Decrypt(ct, "")
		if err != nil || pt != "kubeconfig-secret" {
			t.Fatalf("roundtrip mismatch: pt=%q err=%v", pt, err)
		}
	})
}

func TestInitDevWithoutKeyFallsBackWithWarn(t *testing.T) {
	withKeyEnv(t, "", func() {
		Init("dev") // 不应 panic
		ct, err := Encrypt("demo", "")
		if err != nil {
			t.Fatalf("encrypt: %v", err)
		}
		if pt, err := Decrypt(ct, ""); err != nil || pt != "demo" {
			t.Fatalf("dev fallback roundtrip mismatch: pt=%q err=%v", pt, err)
		}
	})
}

func TestEncryptDecryptRoundtripWithExplicitKey(t *testing.T) {
	ct, err := Encrypt("hello-titan", "explicit-key")
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}
	pt, err := Decrypt(ct, "explicit-key")
	if err != nil {
		t.Fatalf("decrypt with different key should not error on derive: %v", err)
	}
	_ = pt
	// 显式传入相同 key 才能解出原文
	pt2, err := Decrypt(ct, "explicit-key")
	if err != nil || pt2 != "hello-titan" {
		t.Fatalf("roundtrip mismatch: %q %v", pt2, err)
	}
}

func TestMaskSecret(t *testing.T) {
	if got := MaskSecret("abcd1234efgh"); !strings.Contains(got, "******") {
		t.Fatalf("mask should contain placeholder: %q", got)
	}
	if got := MaskSecret("abc"); got != "******" {
		t.Fatalf("short secret should be fully masked: %q", got)
	}
}
