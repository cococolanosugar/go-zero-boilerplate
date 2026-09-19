package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanArtifactModel = (*customTitanArtifactModel)(nil)

type (
	// TitanArtifactModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanArtifactModel.
	TitanArtifactModel interface {
		titanArtifactModel
		// CountByApp 统计应用下的制品数量（删除保护：含制品的应用不可删）
		CountByApp(ctx context.Context, appId int64) (int64, error)
		// ListByPage 分页查询制品
		ListByPage(ctx context.Context, projectId, appId int64, offset, limit int64) ([]*TitanArtifact, int64, error)
		// FindByIds 批量按 ID 查询制品（消除 N+1）
		FindByIds(ctx context.Context, ids []int64) (map[int64]*TitanArtifact, error)
	}

	customTitanArtifactModel struct {
		*defaultTitanArtifactModel
	}
)

// NewTitanArtifactModel returns a model for the database table.
func NewTitanArtifactModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanArtifactModel {
	return &customTitanArtifactModel{
		defaultTitanArtifactModel: newTitanArtifactModel(conn, c, opts...),
	}
}

func (m *customTitanArtifactModel) CountByApp(ctx context.Context, appId int64) (int64, error) {
	var count int64
	query := fmt.Sprintf("select count(*) from %s where `app_id` = ?", m.table)
	err := m.QueryRowNoCacheCtx(ctx, &count, query, appId)
	return count, err
}

func (m *customTitanArtifactModel) ListByPage(ctx context.Context, projectId, appId int64, offset, limit int64) ([]*TitanArtifact, int64, error) {
	where := "WHERE 1=1"
	var args []interface{}
	if projectId > 0 {
		where += " AND project_id = ?"
		args = append(args, projectId)
	}
	if appId > 0 {
		where += " AND app_id = ?"
		args = append(args, appId)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s %s", m.table, where)
	if err := m.QueryRowNoCacheCtx(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	var artifacts []*TitanArtifact
	listQuery := fmt.Sprintf("SELECT id, project_id, app_id, image_url, image_tag, image_digest, git_branch, git_commit, commit_msg, build_exec_id, image_size_bytes, status, create_time, update_time FROM %s %s ORDER BY id DESC LIMIT ?, ?", m.table, where)
	args = append(args, offset, limit)
	if err := m.QueryRowsNoCacheCtx(ctx, &artifacts, listQuery, args...); err != nil {
		return nil, 0, err
	}
	return artifacts, total, nil
}

func (m *customTitanArtifactModel) FindByIds(ctx context.Context, ids []int64) (map[int64]*TitanArtifact, error) {
	result := make(map[int64]*TitanArtifact, len(ids))
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
	var artifacts []*TitanArtifact
	query := fmt.Sprintf("SELECT id, project_id, app_id, image_url, image_tag, image_digest, git_branch, git_commit, commit_msg, build_exec_id, image_size_bytes, status, create_time, update_time FROM %s WHERE id IN (%s)", m.table, placeholders)
	if err := m.QueryRowsNoCacheCtx(ctx, &artifacts, query, args...); err != nil {
		return nil, err
	}
	for _, a := range artifacts {
		result[a.Id] = a
	}
	return result, nil
}
