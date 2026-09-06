package order

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	orderClient "go-zero-boilerplate/app/order/rpc/client/order"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetOrderDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取订单详情（聚合订单与用户信息）
func NewGetOrderDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetOrderDetailLogic {
	return &GetOrderDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetOrderDetailLogic) GetOrderDetail(req *types.OrderDetailReq) (resp *types.OrderDetailResp, err error) {
	orderId := req.OrderId
	if orderId <= 0 {
		orderId = 1001
	}

	// 1. 调用 Order RPC 获取订单信息
	orderResp, err := l.svcCtx.OrderRpc.GetOrder(l.ctx, &orderClient.OrderReq{
		OrderId: orderId,
	})
	if err != nil {
		return nil, err
	}

	// 2. 根据订单中的 UserId 调用 User RPC 获取用户信息
	userResp, err := l.svcCtx.UserRpc.GetUserInfo(l.ctx, &userClient.IdRequest{
		Id: orderResp.UserId,
	})
	if err != nil {
		return nil, err
	}

	// 3. 聚合两个微服务的数据统一输出给客户端
	return &types.OrderDetailResp{
		OrderId:  orderResp.OrderId,
		Item:     orderResp.Item,
		Amount:   orderResp.Amount,
		Status:   orderResp.Status,
		UserId:   userResp.Id,
		UserName: userResp.Name,
		Avatar:   userResp.Avatar,
	}, nil
}
