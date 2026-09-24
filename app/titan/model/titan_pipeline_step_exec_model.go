package model

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanPipelineStepExecModel = (*customTitanPipelineStepExecModel)(nil)

type (
	// TitanPipelineStepExecModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanPipelineStepExecModel.
	TitanPipelineStepExecModel interface {
		titanPipelineStepExecModel
		// ListByExecId 查询执行记录下全部步骤（按 id 升序）
		ListByExecId(ctx context.Context, execId int64) ([]*TitanPipelineStepExec, error)
	}

	customTitanPipelineStepExecModel struct {
		*defaultTitanPipelineStepExecModel
	}
)

// NewTitanPipelineStepExecModel returns a model for the database table.
func NewTitanPipelineStepExecModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanPipelineStepExecModel {
	return &customTitanPipelineStepExecModel{
		defaultTitanPipelineStepExecModel: newTitanPipelineStepExecModel(conn, c, opts...),
	}
}

func (m *customTitanPipelineStepExecModel) ListByExecId(ctx context.Context, execId int64) ([]*TitanPipelineStepExec, error) {
	var steps []*TitanPipelineStepExec
	query := fmt.Sprintf("SELECT id, exec_id, stage_id, step_id, step_name, step_type, status, log_path, error_msg, start_time, end_time, duration_ms, create_time FROM %s WHERE exec_id = ? ORDER BY id ASC", m.table)
	err := m.QueryRowsNoCacheCtx(ctx, &steps, query, execId)
	return steps, err
}
