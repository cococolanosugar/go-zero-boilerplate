package svc

import (
	"go-zero-boilerplate/app/gateway/internal/config"
	orderClient "go-zero-boilerplate/app/order/rpc/client/order"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
	Config   config.Config
	UserRpc  userClient.User
	OrderRpc orderClient.Order
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config:   c,
		UserRpc:  userClient.NewUser(zrpc.MustNewClient(c.UserRpc)),
		OrderRpc: orderClient.NewOrder(zrpc.MustNewClient(c.OrderRpc)),
	}
}
