package perm

import (
	"testing"
)

func TestPermissionRequired_IsEmpty(t *testing.T) {
	tests := []struct {
		name string
		req  PermissionRequired
		want bool
	}{
		{
			name: "empty struct",
			req:  PermissionRequired{},
			want: true,
		},
		{
			name: "single permission configured",
			req: PermissionRequired{
				Permission: "system:user:add",
			},
			want: false,
		},
		{
			name: "all configured",
			req: PermissionRequired{
				All: []string{"system:user:list", "system:user:export"},
			},
			want: false,
		},
		{
			name: "any configured",
			req: PermissionRequired{
				Any: []string{"system:user:list", "system:order:manage"},
			},
			want: false,
		},
		{
			name: "all empty slices and empty string",
			req: PermissionRequired{
				Permission: "",
				All:        []string{},
				Any:        []string{},
			},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.req.IsEmpty(); got != tt.want {
				t.Errorf("PermissionRequired.IsEmpty() = %v, want %v", got, tt.want)
			}
		})
	}
}
