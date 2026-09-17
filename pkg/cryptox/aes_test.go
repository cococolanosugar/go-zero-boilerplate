package cryptox

import (
	"testing"
)

func TestEncryptDecrypt(t *testing.T) {
	cases := []struct {
		name      string
		plaintext string
		key       string
	}{
		{
			name:      "Empty string",
			plaintext: "",
			key:       "my-custom-key-12345",
		},
		{
			name:      "Standard Jenkins API token",
			plaintext: "11a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7",
			key:       "enterprise-super-secret",
		},
		{
			name:      "GitLab PAT",
			plaintext: "glpat-xxxxxxxxxxxxxxxxxxxx",
			key:       "",
		},
		{
			name:      "Complex Kubeconfig YAML text",
			plaintext: "apiVersion: v1\nclusters:\n- cluster:\n    server: https://10.0.0.1:6443\n",
			key:       "titan-k8s-cluster-key",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			encrypted, err := Encrypt(tc.plaintext, tc.key)
			if err != nil {
				t.Fatalf("Encrypt failed: %v", err)
			}

			if tc.plaintext != "" && encrypted == tc.plaintext {
				t.Fatalf("Encrypted text should not equal plaintext")
			}

			decrypted, err := Decrypt(encrypted, tc.key)
			if err != nil {
				t.Fatalf("Decrypt failed: %v", err)
			}

			if decrypted != tc.plaintext {
				t.Fatalf("Decrypted %q != expected plaintext %q", decrypted, tc.plaintext)
			}
		})
	}
}

func TestCorruptedCiphertext(t *testing.T) {
	encrypted, err := Encrypt("hello world", "test-key")
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}

	// Tamper with ciphertext
	corrupted := encrypted[:len(encrypted)-4] + "ffff"
	_, err = Decrypt(corrupted, "test-key")
	if err == nil {
		t.Fatalf("Expected decryption error on tampered ciphertext, got nil")
	}

	// Wrong key
	_, err = Decrypt(encrypted, "wrong-key")
	if err == nil {
		t.Fatalf("Expected decryption error with wrong key, got nil")
	}
}

func TestMaskSecret(t *testing.T) {
	if got := MaskSecret("1234567890"); got != "123******890" {
		t.Fatalf("expected 123******890, got %s", got)
	}
	if got := MaskSecret("short"); got != "******" {
		t.Fatalf("expected ******, got %s", got)
	}
}
