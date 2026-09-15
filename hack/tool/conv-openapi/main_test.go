package main

import "testing"

func TestTagForPath(t *testing.T) {
	tests := []struct {
		name string
		path string
		want string
	}{
		{name: "dashboard module", path: "/api/v1/dashboard/overview", want: "dashboard"},
		{name: "user module", path: "/api/v1/user/profile", want: "user"},
		{name: "new order module", path: "/api/v1/order/list", want: "order"},
		{name: "new pay module", path: "/api/v1/pay/checkout", want: "pay"},
		{name: "navigation special case", path: "/api/v1/system/navigation/list", want: "navigation"},
		{name: "dictionary special case", path: "/api/v1/system/dict/types", want: "dict"},
		{name: "task special case", path: "/api/v1/system/task/list", want: "task"},
		{name: "invalid path", path: "/health", want: "other"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := tagForPath(test.path); got != test.want {
				t.Fatalf("tagForPath(%q) = %q, want %q", test.path, got, test.want)
			}
		})
	}
}
