package meta

import (
	"database/sql"
	"fmt"
	"strings"

	_ "github.com/go-sql-driver/mysql"
)

// InspectTable 从 MySQL 数据库中读取指定表的元数据
func InspectTable(db *sql.DB, dbName, tableName, serviceName string) (*TableMeta, error) {
	// 1. 查询表注释
	var tableComment sql.NullString
	tableQuery := `
		SELECT TABLE_COMMENT 
		FROM information_schema.TABLES 
		WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
	`
	err := db.QueryRow(tableQuery, dbName, tableName).Scan(&tableComment)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("table %s.%s not found", dbName, tableName)
		}
		return nil, fmt.Errorf("failed to query table comment: %w", err)
	}

	// 2. 查询列信息
	colQuery := `
		SELECT 
			COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, 
			COLUMN_KEY, COLUMN_COMMENT, EXTRA
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
		ORDER BY ORDINAL_POSITION
	`
	rows, err := db.Query(colQuery, dbName, tableName)
	if err != nil {
		return nil, fmt.Errorf("failed to query columns: %w", err)
	}
	defer rows.Close()

	var columns []ColumnMeta
	var primaryKey ColumnMeta
	hasPk := false

	for rows.Next() {
		var col ColumnMeta
		var isNullableStr string
		var colComment sql.NullString
		var colKey sql.NullString
		var extra sql.NullString

		err := rows.Scan(
			&col.ColumnName,
			&col.DataType,
			&col.ColumnType,
			&isNullableStr,
			&colKey,
			&colComment,
			&extra,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan column: %w", err)
		}

		col.IsNullable = isNullableStr == "YES"
		if colKey.Valid {
			col.ColumnKey = colKey.String
		}
		if colComment.Valid {
			col.ColumnComment = CleanComment(colComment.String)
		}
		if extra.Valid {
			col.Extra = extra.String
		}

		col.MapColumnTypes()

		if col.IsPrimaryKey && !hasPk {
			primaryKey = col
			hasPk = true
		}

		columns = append(columns, col)
	}

	if len(columns) == 0 {
		return nil, fmt.Errorf("table %s.%s has no columns or does not exist", dbName, tableName)
	}

	if !hasPk {
		// 如果未定义显式主键，默认使用第一列
		primaryKey = columns[0]
		primaryKey.IsPrimaryKey = true
	}

	comment := CleanComment(tableComment.String)
	if comment == "" {
		comment = tableName
	}

	entityName := ToPascalCase(tableName)
	entityLower := ToCamelCase(tableName)
	entitySnake := strings.ToLower(strings.ReplaceAll(tableName, "-", "_"))
	routePath := ToKebabCase(tableName)

	return &TableMeta{
		TableName:    tableName,
		TableComment: comment,
		ServiceName:  serviceName,
		EntityName:   entityName,
		EntityLower:  entityLower,
		EntitySnake:  entitySnake,
		RoutePath:    routePath,
		Columns:      columns,
		PrimaryKey:   primaryKey,
	}, nil
}
