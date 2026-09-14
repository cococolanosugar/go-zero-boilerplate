package svc

import (
	"go-zero-boilerplate/app/itsm/model"
	"go-zero-boilerplate/app/itsm/rpc/internal/config"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ServiceContext struct {
	Config           config.Config
	SqlConn          sqlx.SqlConn
	ProcessDefModel  model.ItsmProcessDefModel
	ProcessInstModel model.ItsmProcessInstModel
	TaskModel        model.ItsmTaskModel
	TicketDataModel  model.ItsmTicketDataModel
	TaskLogModel     model.ItsmTaskLogModel
	SlaPolicyModel   model.ItsmSlaPolicyModel
}

func NewServiceContext(c config.Config) *ServiceContext {
	conn := sqlx.NewMysql(c.DataSource)
	return &ServiceContext{
		Config:           c,
		SqlConn:          conn,
		ProcessDefModel:  model.NewItsmProcessDefModel(conn, c.Cache),
		ProcessInstModel: model.NewItsmProcessInstModel(conn, c.Cache),
		TaskModel:        model.NewItsmTaskModel(conn, c.Cache),
		TicketDataModel:  model.NewItsmTicketDataModel(conn, c.Cache),
		TaskLogModel:     model.NewItsmTaskLogModel(conn, c.Cache),
		SlaPolicyModel:   model.NewItsmSlaPolicyModel(conn, c.Cache),
	}
}
