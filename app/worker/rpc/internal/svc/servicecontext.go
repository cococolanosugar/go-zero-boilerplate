package svc

import (
	"go-zero-boilerplate/app/worker/model"
	"go-zero-boilerplate/app/worker/rpc/internal/activities"
	"go-zero-boilerplate/app/worker/rpc/internal/config"
	"go-zero-boilerplate/app/worker/rpc/internal/workflows"
	"go-zero-boilerplate/pkg/temporalx"

	_ "github.com/go-sql-driver/mysql"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)

type TemporalWorkerService struct {
	Worker worker.Worker
}

func (s *TemporalWorkerService) Start() {
	if s.Worker != nil {
		if err := s.Worker.Start(); err != nil {
			logx.Errorf("Failed to start Temporal worker: %v", err)
		} else {
			logx.Info("Temporal worker started successfully")
		}
	}
}

func (s *TemporalWorkerService) Stop() {
	if s.Worker != nil {
		s.Worker.Stop()
		logx.Info("Temporal worker stopped")
	}
}

type ServiceContext struct {
	Config                config.Config
	TemporalClient        client.Client
	SysAsyncTaskModel     model.SysAsyncTaskModel
	TemporalWorkerService *TemporalWorkerService
}

func NewServiceContext(c config.Config) *ServiceContext {
	temporalClient, err := temporalx.NewClient(c.Temporal)
	if err != nil {
		logx.Must(err)
	}

	// Initialize Database Model with Redis Cache
	sqlConn := sqlx.NewMysql(c.DataSource)
	asyncTaskModel := model.NewSysAsyncTaskModel(sqlConn, c.Cache)

	// Initialize Temporal Worker
	w := worker.New(temporalClient, c.Temporal.TaskQueue, worker.Options{})
	w.RegisterWorkflow(workflows.DailyReportWorkflow)
	w.RegisterWorkflow(workflows.HelloWorldWorkflow)
	w.RegisterWorkflow(workflows.ItsmSlaMonitorWorkflow)
	w.RegisterWorkflow(workflows.TitanPipelineWorkflow)

	taskActs := activities.NewTaskActivities()
	w.RegisterActivity(taskActs)
	w.RegisterActivity(activities.NewItsmSlaActivities(sqlConn))
	w.RegisterActivity(activities.NewDevopsPipelineActivities(sqlConn))

	return &ServiceContext{
		Config:                c,
		TemporalClient:        temporalClient,
		SysAsyncTaskModel:     asyncTaskModel,
		TemporalWorkerService: &TemporalWorkerService{Worker: w},
	}
}
