package svc

import (
	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/config"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ServiceContext struct {
	Config                config.Config
	SqlConn               sqlx.SqlConn
	IntegrationModel      model.TitanIntegrationModel
	ClusterModel          model.TitanClusterModel
	PipelineModel         model.TitanPipelineModel
	PipelineExecModel     model.TitanPipelineExecModel
	PipelineStepExecModel model.TitanPipelineStepExecModel
	ProjectModel          model.TitanProjectModel
	AppModel              model.TitanAppModel
	EnvModel              model.TitanEnvModel
	ArtifactModel         model.TitanArtifactModel
	EnvAppBindingModel    model.TitanEnvAppBindingModel
}

func NewServiceContext(c config.Config) *ServiceContext {
	conn := sqlx.NewMysql(c.DataSource)
	return &ServiceContext{
		Config:                c,
		SqlConn:               conn,
		IntegrationModel:      model.NewTitanIntegrationModel(conn, c.Cache),
		ClusterModel:          model.NewTitanClusterModel(conn, c.Cache),
		PipelineModel:         model.NewTitanPipelineModel(conn, c.Cache),
		PipelineExecModel:     model.NewTitanPipelineExecModel(conn, c.Cache),
		PipelineStepExecModel: model.NewTitanPipelineStepExecModel(conn, c.Cache),
		ProjectModel:          model.NewTitanProjectModel(conn, c.Cache),
		AppModel:              model.NewTitanAppModel(conn, c.Cache),
		EnvModel:              model.NewTitanEnvModel(conn, c.Cache),
		ArtifactModel:         model.NewTitanArtifactModel(conn, c.Cache),
		EnvAppBindingModel:    model.NewTitanEnvAppBindingModel(conn, c.Cache),
	}
}
