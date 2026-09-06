package orderlogic

import (
	"context"
	"errors"

	"go-zero-boilerplate/app/order/model"
	"go-zero-boilerplate/app/order/rpc/internal/svc"
	"go-zero-boilerplate/app/order/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetOrderLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetOrderLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetOrderLogic {
	return &GetOrderLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetOrderLogic) GetOrder(in *pb.OrderReq) (*pb.OrderResp, error) {
	if in.OrderId <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	order, err := l.svcCtx.OrdersModel.FindOneByOrderId(l.ctx, in.OrderId)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, xerr.NewErrMsg("订单不存在")
		}
		l.Errorf("FindOneByOrderId err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.OrderResp{
		OrderId: order.OrderId,
		UserId:  order.UserId,
		Item:    order.Item,
		Amount:  order.Amount,
		Status:  order.Status,
	}, nil
}

