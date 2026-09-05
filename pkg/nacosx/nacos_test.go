package nacosx

import (
	"testing"
)

func TestRegisterService_EmptyHost(t *testing.T) {
	err := RegisterService("test.rpc", "127.0.0.1:8080", NacosConf{})
	if err != nil {
		t.Fatalf("expected nil for empty host, got %v", err)
	}
}

func TestNacosConf_Defaults(t *testing.T) {
	conf := NacosConf{
		Host: "127.0.0.1",
		Port: 8848,
	}
	if conf.Port != 8848 {
		t.Fatalf("expected port 8848, got %d", conf.Port)
	}
}
