package svc

import (
	"go-zero-boilerplate/app/devops/model"
	"go-zero-boilerplate/app/devops/rpc/internal/config"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ServiceContext struct {
	Config               config.Config
	SqlConn              sqlx.SqlConn
	IntegrationModel     model.DevopsIntegrationModel
	ClusterModel         model.DevopsClusterModel
	PipelineModel        model.DevopsPipelineModel
	PipelineExecModel    model.DevopsPipelineExecModel
	PipelineStepExecModel model.DevopsPipelineStepExecModel
}

func NewServiceContext(c config.Config) *ServiceContext {
	conn := sqlx.NewMysql(c.DataSource)
	return &ServiceContext{
		Config:                c,
		SqlConn:               conn,
		IntegrationModel:      model.NewDevopsIntegrationModel(conn, c.Cache),
		ClusterModel:          model.NewDevopsClusterModel(conn, c.Cache),
		PipelineModel:         model.NewDevopsPipelineModel(conn, c.Cache),
		PipelineExecModel:     model.NewDevopsPipelineExecModel(conn, c.Cache),
		PipelineStepExecModel: model.NewDevopsPipelineStepExecModel(conn, c.Cache),
	}
}
