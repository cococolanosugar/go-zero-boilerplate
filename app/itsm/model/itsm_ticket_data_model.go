package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ ItsmTicketDataModel = (*customItsmTicketDataModel)(nil)

type (
	// ItsmTicketDataModel is an interface to be customized, add more methods here,
	// and implement the added methods in customItsmTicketDataModel.
	ItsmTicketDataModel interface {
		itsmTicketDataModel
	}

	customItsmTicketDataModel struct {
		*defaultItsmTicketDataModel
	}
)

// NewItsmTicketDataModel returns a model for the database table.
func NewItsmTicketDataModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) ItsmTicketDataModel {
	return &customItsmTicketDataModel{
		defaultItsmTicketDataModel: newItsmTicketDataModel(conn, c, opts...),
	}
}
