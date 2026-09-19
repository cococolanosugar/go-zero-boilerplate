package model

import (
	"context"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanClusterModel = (*customTitanClusterModel)(nil)

type (
	// TitanClusterModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanClusterModel.
	TitanClusterModel interface {
		titanClusterModel
		// ListByPage 分页查询集群（不含 kubeconfig 敏感大字段）
		ListByPage(ctx context.Context, env string, offset, limit int64) ([]*TitanClusterLight, int64, error)
		// FindByIds 批量按 ID 查询集群（消除 N+1）
		FindByIds(ctx context.Context, ids []int64) (map[int64]*TitanClusterLight, error)
	}

	customTitanClusterModel struct {
		*defaultTitanClusterModel
	}
)

// NewTitanClusterModel returns a model for the database table.
func NewTitanClusterModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanClusterModel {
	return &customTitanClusterModel{
		defaultTitanClusterModel: newTitanClusterModel(conn, c, opts...),
	}
}

// TitanClusterLight 集群列表轻量结构（不含 kubeconfig 凭据文本，
// 供部分列 SELECT 扫描使用——go-zero sqlx 严格模式下列数必须与 struct 字段数一致）
type TitanClusterLight struct {
	Id          int64     `db:"id"`
	Name        string    `db:"name"`
	Env         string    `db:"env"`
	ApiEndpoint string    `db:"api_endpoint"`
	Status      string    `db:"status"`
	Version     string    `db:"version"`
	Description string    `db:"description"`
	CreatedBy   int64     `db:"created_by"`
	CreateTime  time.Time `db:"create_time"`
	UpdateTime  time.Time `db:"update_time"`
}

// titanClusterListColumns 列表列（剔除 kubeconfig 凭据文本）
const titanClusterListColumns = "id, name, env, api_endpoint, status, version, description, created_by, create_time, update_time"

func (m *customTitanClusterModel) ListByPage(ctx context.Context, env string, offset, limit int64) ([]*TitanClusterLight, int64, error) {
	where := "WHERE 1=1"
	var args []interface{}
	if env != "" {
		where += " AND env = ?"
		args = append(args, env)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s %s", m.table, where)
	if err := m.QueryRowNoCacheCtx(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	var clusters []*TitanClusterLight
	listQuery := fmt.Sprintf("SELECT %s FROM %s %s ORDER BY id DESC LIMIT ?, ?", titanClusterListColumns, m.table, where)
	args = append(args, offset, limit)
	if err := m.QueryRowsNoCacheCtx(ctx, &clusters, listQuery, args...); err != nil {
		return nil, 0, err
	}
	return clusters, total, nil
}

func (m *customTitanClusterModel) FindByIds(ctx context.Context, ids []int64) (map[int64]*TitanClusterLight, error) {
	result := make(map[int64]*TitanClusterLight, len(ids))
	if len(ids) == 0 {
		return result, nil
	}
	placeholders := ""
	args := make([]interface{}, 0, len(ids))
	for i, id := range ids {
		if i > 0 {
			placeholders += ","
		}
		placeholders += "?"
		args = append(args, id)
	}
	var clusters []*TitanClusterLight
	query := fmt.Sprintf("SELECT %s FROM %s WHERE id IN (%s)", titanClusterListColumns, m.table, placeholders)
	if err := m.QueryRowsNoCacheCtx(ctx, &clusters, query, args...); err != nil {
		return nil, err
	}
	for _, c := range clusters {
		result[c.Id] = c
	}
	return result, nil
}
