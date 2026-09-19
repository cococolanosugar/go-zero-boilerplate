package svc

import (
	itsmClient "go-zero-boilerplate/app/itsm/rpc/client/itsm"
	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/config"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
	"github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
	Config                config.Config
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
	ReleaseOrderModel     model.TitanReleaseOrderModel
	ItsmRpc               itsmClient.Itsm
}

func NewServiceContext(c config.Config) *ServiceContext {
	conn := sqlx.NewMysql(c.DataSource)
	var itsmRpc itsmClient.Itsm
	if len(c.ItsmRpc.Endpoints) > 0 || c.ItsmRpc.Target != "" {
		itsmRpc = itsmClient.NewItsm(zrpc.MustNewClient(c.ItsmRpc))
	}
	return &ServiceContext{
		Config:                c,
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
		ReleaseOrderModel:     model.NewTitanReleaseOrderModel(conn, c.Cache),
		ItsmRpc:               itsmRpc,
	}
}
