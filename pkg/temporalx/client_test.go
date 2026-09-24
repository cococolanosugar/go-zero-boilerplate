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
		t.Skipf("Skipping integration test: Temporal server not reachable at %s: %v", c.HostPort, err)
	}
	defer cli.Close()
}
