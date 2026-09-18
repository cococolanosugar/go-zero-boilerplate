package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanPipelineModel = (*customTitanPipelineModel)(nil)

type (
	// TitanPipelineModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanPipelineModel.
	TitanPipelineModel interface {
		titanPipelineModel
	}

	customTitanPipelineModel struct {
		*defaultTitanPipelineModel
	}
)

// NewTitanPipelineModel returns a model for the database table.
func NewTitanPipelineModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanPipelineModel {
	return &customTitanPipelineModel{
		defaultTitanPipelineModel: newTitanPipelineModel(conn, c, opts...),
	}
}
