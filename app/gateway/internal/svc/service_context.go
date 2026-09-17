package svc

import (
	"go-zero-boilerplate/app/gateway/internal/config"
	itsmClient "go-zero-boilerplate/app/itsm/rpc/client/itsm"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"
	workerClient "go-zero-boilerplate/app/worker/rpc/client/worker"
	"go-zero-boilerplate/pkg/session"
	"go-zero-boilerplate/pkg/storage"

	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
	Config           config.Config
	UserRpc          userClient.User
	WorkerRpc        workerClient.Worker
	ItsmRpc          itsmClient.Itsm
	Storage          storage.Driver
	RedisClient      *redis.Redis
	SessionMgr       *session.Manager
	OpenApiSpecBytes []byte
}

func NewServiceContext(c config.Config) *ServiceContext {
	storageDriver, err := storage.NewDriver(c.Storage)
	if err != nil {
		panic(err)
	}

	redisClient := redis.MustNewRedis(c.Redis)
	sessionMgr := session.NewManager(redisClient)

	return &ServiceContext{
		Config:      c,
		UserRpc:     userClient.NewUser(zrpc.MustNewClient(c.UserRpc)),
		WorkerRpc:   workerClient.NewWorker(zrpc.MustNewClient(c.WorkerRpc)),
		ItsmRpc:     itsmClient.NewItsm(zrpc.MustNewClient(c.ItsmRpc)),
		Storage:     storageDriver,
		RedisClient: redisClient,
		SessionMgr:  sessionMgr,
	}
}
