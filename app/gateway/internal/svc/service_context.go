package svc

import (
	"go-zero-boilerplate/app/gateway/internal/config"
	orderClient "go-zero-boilerplate/app/order/rpc/client/order"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"
	"go-zero-boilerplate/pkg/storage"

	"github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
	Config   config.Config
	UserRpc  userClient.User
	OrderRpc orderClient.Order
	Storage  storage.Driver
}

func NewServiceContext(c config.Config) *ServiceContext {
	storageDriver, err := storage.NewDriver(c.Storage)
	if err != nil {
		panic(err)
	}

	return &ServiceContext{
		Config:   c,
		UserRpc:  userClient.NewUser(zrpc.MustNewClient(c.UserRpc)),
		OrderRpc: orderClient.NewOrder(zrpc.MustNewClient(c.OrderRpc)),
		Storage:  storageDriver,
	}
}
