package meta

import (
	"strings"
	"unicode"
)

type ColumnMeta struct {
	ColumnName    string
	DataType      string
	ColumnType    string
	IsNullable    bool
	ColumnKey     string // "PRI", "UNI", "MUL"
	ColumnComment string
	Extra         string

	// 派生代码生成属性
	GoField          string
	GoType           string
	ProtoField       string
	ProtoType        string
	JsonTag          string
	TsField          string
	TsType           string
	ProTableValueType string
	IsPrimaryKey     bool
	IsCommonField    bool
	FormRequired     bool
}

type TableMeta struct {
	TableName    string
	TableComment string
	ServiceName  string
	EntityName   string // 例如 "SysPost"
	EntityLower  string // 例如 "sysPost"
	EntitySnake  string // 例如 "sys_post"
	RoutePath    string // 例如 "posts" 或 "sys-posts"
	Columns      []ColumnMeta
	PrimaryKey   ColumnMeta
}

// ToPascalCase 转大驼峰 (sys_user -> SysUser, id -> Id, user_id -> UserId)
func ToPascalCase(s string) string {
	parts := strings.Split(s, "_")
	var result strings.Builder
	for _, part := range parts {
		if len(part) == 0 {
			continue
		}
		upper := strings.ToUpper(part)
		if upper == "ID" {
			result.WriteString("Id")
			continue
		}
		if upper == "IP" || upper == "URL" || upper == "URI" || upper == "API" || upper == "RPC" || upper == "SSO" || upper == "JWT" {
			result.WriteString(upper)
			continue
		}
		runes := []rune(part)
		runes[0] = unicode.ToUpper(runes[0])
		result.WriteString(string(runes))
	}
	return result.String()
}

// ToCamelCase 转小驼峰 (sys_user -> sysUser, id -> id, user_id -> userId)
func ToCamelCase(s string) string {
	if strings.ToLower(s) == "id" {
		return "id"
	}
	pascal := ToPascalCase(s)
	if len(pascal) == 0 {
		return ""
	}
	runes := []rune(pascal)
	runes[0] = unicode.ToLower(runes[0])
	return string(runes)
}

// ToKebabCase 转短横线 (sys_user -> sys-user)
func ToKebabCase(s string) string {
	return strings.ReplaceAll(strings.ToLower(s), "_", "-")
}

// MapColumnTypes 将数据库列信息映射为 Go, Proto, TypeScript 和 AntD ProTable 类型
func (c *ColumnMeta) MapColumnTypes() {
	c.IsPrimaryKey = c.ColumnKey == "PRI" || strings.ToLower(c.ColumnName) == "id"
	lowerName := strings.ToLower(c.ColumnName)
	c.IsCommonField = lowerName == "create_time" || lowerName == "update_time" || lowerName == "deleted_at" || lowerName == "delete_time"
	c.FormRequired = !c.IsNullable && !c.IsPrimaryKey && !c.IsCommonField

	c.GoField = ToPascalCase(c.ColumnName)
	c.ProtoField = c.ColumnName
	c.JsonTag = ToCamelCase(c.ColumnName)
	c.TsField = ToCamelCase(c.ColumnName)

	dt := strings.ToLower(c.DataType)
	switch {
	case strings.Contains(dt, "int"):
		if dt == "tinyint" && strings.Contains(c.ColumnType, "(1)") {
			c.GoType = "int64"
			c.ProtoType = "int64"
			c.TsType = "number"
			c.ProTableValueType = "select"
		} else {
			c.GoType = "int64"
			c.ProtoType = "int64"
			c.TsType = "number"
			if strings.Contains(lowerName, "status") || strings.Contains(lowerName, "type") {
				c.ProTableValueType = "select"
			} else {
				c.ProTableValueType = "digit"
			}
		}
	case strings.Contains(dt, "decimal") || strings.Contains(dt, "float") || strings.Contains(dt, "double"):
		c.GoType = "float64"
		c.ProtoType = "double"
		c.TsType = "number"
		if strings.Contains(lowerName, "amount") || strings.Contains(lowerName, "price") || strings.Contains(lowerName, "money") {
			c.ProTableValueType = "money"
		} else {
			c.ProTableValueType = "digit"
		}
	case strings.Contains(dt, "time") || strings.Contains(dt, "date"):
		c.GoType = "string"
		c.ProtoType = "string"
		c.TsType = "string"
		c.ProTableValueType = "dateTime"
	default:
		c.GoType = "string"
		c.ProtoType = "string"
		c.TsType = "string"
		if dt == "text" || dt == "mediumtext" || dt == "longtext" || strings.Contains(lowerName, "remark") || strings.Contains(lowerName, "desc") {
			c.ProTableValueType = "textarea"
		} else {
			c.ProTableValueType = "text"
		}
	}
}

// CleanComment 清理注释中的特殊换行符
func CleanComment(comment string) string {
	comment = strings.TrimSpace(comment)
	comment = strings.ReplaceAll(comment, "\r\n", " ")
	comment = strings.ReplaceAll(comment, "\n", " ")
	return comment
}
