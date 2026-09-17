package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ DevopsPipelineExecModel = (*customDevopsPipelineExecModel)(nil)

type (
	// DevopsPipelineExecModel is an interface to be customized, add more methods here,
	// and implement the added methods in customDevopsPipelineExecModel.
	DevopsPipelineExecModel interface {
		devopsPipelineExecModel
	}

	customDevopsPipelineExecModel struct {
		*defaultDevopsPipelineExecModel
	}
)

// NewDevopsPipelineExecModel returns a model for the database table.
func NewDevopsPipelineExecModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) DevopsPipelineExecModel {
	return &customDevopsPipelineExecModel{
		defaultDevopsPipelineExecModel: newDevopsPipelineExecModel(conn, c, opts...),
	}
}
