package temporalx

import (
	"testing"
)

func TestNewClient(t *testing.T) {
	c := Config{
		HostPort:  "127.0.0.1:7233",
		Namespace: "default",
	}
	cli, err := NewClient(c)
	if err != nil {
		t.Fatalf("Failed to connect to temporal server: %v", err)
	}
	defer cli.Close()
}
