package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanPipelineExecModel = (*customTitanPipelineExecModel)(nil)

type (
	// TitanPipelineExecModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanPipelineExecModel.
	TitanPipelineExecModel interface {
		titanPipelineExecModel
	}

	customTitanPipelineExecModel struct {
		*defaultTitanPipelineExecModel
	}
)

// NewTitanPipelineExecModel returns a model for the database table.
func NewTitanPipelineExecModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanPipelineExecModel {
	return &customTitanPipelineExecModel{
		defaultTitanPipelineExecModel: newTitanPipelineExecModel(conn, c, opts...),
	}
}
