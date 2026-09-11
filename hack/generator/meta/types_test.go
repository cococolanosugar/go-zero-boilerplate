package meta

import (
	"testing"
)

func TestToPascalCase(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"sys_user", "SysUser"},
		{"sys_post", "SysPost"},
		{"order_id", "OrderId"},
		{"id", "Id"},
		{"user_ip", "UserIP"},
		{"api_url", "APIURL"},
	}

	for _, tt := range tests {
		got := ToPascalCase(tt.input)
		if got != tt.expected {
			t.Errorf("ToPascalCase(%q) = %q, expected %q", tt.input, got, tt.expected)
		}
	}
}

func TestToCamelCase(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"sys_user", "sysUser"},
		{"sys_post", "sysPost"},
		{"post_name", "postName"},
		{"id", "id"},
	}

	for _, tt := range tests {
		got := ToCamelCase(tt.input)
		if got != tt.expected {
			t.Errorf("ToCamelCase(%q) = %q, expected %q", tt.input, got, tt.expected)
		}
	}
}

func TestMapColumnTypes(t *testing.T) {
	colInt := ColumnMeta{
		ColumnName: "id",
		DataType:   "bigint",
		ColumnType: "bigint",
		ColumnKey:  "PRI",
	}
	colInt.MapColumnTypes()
	if !colInt.IsPrimaryKey || colInt.GoType != "int64" || colInt.TsType != "number" {
		t.Errorf("colInt mapping mismatch: %+v", colInt)
	}

	colStatus := ColumnMeta{
		ColumnName: "status",
		DataType:   "tinyint",
		ColumnType: "tinyint(1)",
	}
	colStatus.MapColumnTypes()
	if colStatus.ProTableValueType != "select" || colStatus.GoType != "int64" {
		t.Errorf("colStatus mapping mismatch: %+v", colStatus)
	}

	colAmount := ColumnMeta{
		ColumnName: "order_amount",
		DataType:   "decimal",
		ColumnType: "decimal(10,2)",
	}
	colAmount.MapColumnTypes()
	if colAmount.ProTableValueType != "money" || colAmount.GoType != "float64" {
		t.Errorf("colAmount mapping mismatch: %+v", colAmount)
	}

	colTime := ColumnMeta{
		ColumnName: "create_time",
		DataType:   "datetime",
		ColumnType: "datetime",
	}
	colTime.MapColumnTypes()
	if !colTime.IsCommonField || colTime.ProTableValueType != "dateTime" {
		t.Errorf("colTime mapping mismatch: %+v", colTime)
	}
}
