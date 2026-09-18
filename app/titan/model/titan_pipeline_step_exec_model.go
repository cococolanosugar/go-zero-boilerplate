package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanPipelineStepExecModel = (*customTitanPipelineStepExecModel)(nil)

type (
	// TitanPipelineStepExecModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanPipelineStepExecModel.
	TitanPipelineStepExecModel interface {
		titanPipelineStepExecModel
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
