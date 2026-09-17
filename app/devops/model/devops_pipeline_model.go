package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ DevopsPipelineModel = (*customDevopsPipelineModel)(nil)

type (
	// DevopsPipelineModel is an interface to be customized, add more methods here,
	// and implement the added methods in customDevopsPipelineModel.
	DevopsPipelineModel interface {
		devopsPipelineModel
	}

	customDevopsPipelineModel struct {
		*defaultDevopsPipelineModel
	}
)

// NewDevopsPipelineModel returns a model for the database table.
func NewDevopsPipelineModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) DevopsPipelineModel {
	return &customDevopsPipelineModel{
		defaultDevopsPipelineModel: newDevopsPipelineModel(conn, c, opts...),
	}
}
