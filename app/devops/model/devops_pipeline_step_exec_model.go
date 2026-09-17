package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ DevopsPipelineStepExecModel = (*customDevopsPipelineStepExecModel)(nil)

type (
	// DevopsPipelineStepExecModel is an interface to be customized, add more methods here,
	// and implement the added methods in customDevopsPipelineStepExecModel.
	DevopsPipelineStepExecModel interface {
		devopsPipelineStepExecModel
	}

	customDevopsPipelineStepExecModel struct {
		*defaultDevopsPipelineStepExecModel
	}
)

// NewDevopsPipelineStepExecModel returns a model for the database table.
func NewDevopsPipelineStepExecModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) DevopsPipelineStepExecModel {
	return &customDevopsPipelineStepExecModel{
		defaultDevopsPipelineStepExecModel: newDevopsPipelineStepExecModel(conn, c, opts...),
	}
}
