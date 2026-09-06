package svc

import (
	"go-zero-boilerplate/app/order/model"
	"go-zero-boilerplate/app/order/rpc/internal/config"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ServiceContext struct {
	Config      config.Config
	OrdersModel model.OrdersModel
}

func NewServiceContext(c config.Config) *ServiceContext {
	conn := sqlx.NewMysql(c.DataSource)
	return &ServiceContext{
		Config:      c,
		OrdersModel: model.NewOrdersModel(conn, c.Cache),
	}
}
