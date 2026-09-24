package confx

import (
	"os"
	"path/filepath"
	"testing"
)

type testConfig struct {
	Name string `json:"Name"`
	Port int    `json:"Port"`
	Host string `json:"Host"`
	DSN  string `json:"DSN"`
}

func TestExpandEnvWithDefault(t *testing.T) {
	t.Setenv("EXISTING_VAR", "my_custom_value")
	t.Setenv("DB_USER", "custom_admin")

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "placeholder with default when unset",
			input:    "host: ${UNSET_VAR:127.0.0.1}",
			expected: "host: 127.0.0.1",
		},
		{
			name:     "placeholder with default when set",
			input:    "value: ${EXISTING_VAR:default_value}",
			expected: "value: my_custom_value",
		},
		{
			name:     "standard placeholder when unset",
			input:    "value: ${ANOTHER_UNSET}",
			expected: "value: ",
		},
		{
			name:     "standard placeholder when set",
			input:    "value: ${EXISTING_VAR}",
			expected: "value: my_custom_value",
		},
		{
			name:     "complex DSN with multiple colons in default",
			input:    "dsn: ${DB_DSN:root:root@tcp(127.0.0.1:3306)/my_db?charset=utf8mb4}",
			expected: "dsn: root:root@tcp(127.0.0.1:3306)/my_db?charset=utf8mb4",
		},
		{
			name:     "no placeholder unchanged",
			input:    "normal text: without vars",
			expected: "normal text: without vars",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExpandEnvWithDefault(tt.input)
			if got != tt.expected {
				t.Errorf("ExpandEnvWithDefault(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestLoad(t *testing.T) {
	tmpDir := t.TempDir()
	yamlPath := filepath.Join(tmpDir, "config.yaml")

	yamlContent := `
Name: ${APP_NAME:sample-app}
Port: ${APP_PORT:8080}
Host: ${APP_HOST:0.0.0.0}
DSN: ${DB_DSN:root:secret@tcp(127.0.0.1:3306)/test_db}
`
	if err := os.WriteFile(yamlPath, []byte(yamlContent), 0644); err != nil {
		t.Fatalf("failed to write test yaml: %v", err)
	}

	var c testConfig
	if err := Load(yamlPath, &c); err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	if c.Name != "sample-app" {
		t.Errorf("expected Name 'sample-app', got '%s'", c.Name)
	}
	if c.Port != 8080 {
		t.Errorf("expected Port 8080, got %d", c.Port)
	}
	if c.Host != "0.0.0.0" {
		t.Errorf("expected Host '0.0.0.0', got '%s'", c.Host)
	}
	if c.DSN != "root:secret@tcp(127.0.0.1:3306)/test_db" {
		t.Errorf("expected DSN 'root:secret@tcp(127.0.0.1:3306)/test_db', got '%s'", c.DSN)
	}

	// Test with env override
	t.Setenv("APP_NAME", "overridden-app")
	var c2 testConfig
	MustLoad(yamlPath, &c2)
	if c2.Name != "overridden-app" {
		t.Errorf("expected Name 'overridden-app', got '%s'", c2.Name)
	}
}
