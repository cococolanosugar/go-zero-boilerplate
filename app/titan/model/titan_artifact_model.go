package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanArtifactModel = (*customTitanArtifactModel)(nil)

type (
	// TitanArtifactModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanArtifactModel.
	TitanArtifactModel interface {
		titanArtifactModel
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
