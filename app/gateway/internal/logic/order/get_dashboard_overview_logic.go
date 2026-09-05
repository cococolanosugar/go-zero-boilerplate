package order

import (
	"context"
	"encoding/json"
	"time"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	orderClient "go-zero-boilerplate/app/order/rpc/client/order"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/mr"
)

type GetDashboardOverviewLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取大盘聚合信息（mr.Finish 内网并发拉取微服务）
func NewGetDashboardOverviewLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetDashboardOverviewLogic {
	return &GetDashboardOverviewLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetDashboardOverviewLogic) GetDashboardOverview(req *types.DashboardReq) (resp *types.DashboardResp, err error) {
	// 1. 获取当前用户 ID（从 JWT 提取）
	var userId int64 = 1
	if uidVal := l.ctx.Value("userId"); uidVal != nil {
		if uidJson, ok := uidVal.(json.Number); ok {
			if uidInt, err := uidJson.Int64(); err == nil {
				userId = uidInt
			}
		} else if uidInt, ok := uidVal.(int64); ok {
			userId = uidInt
		}
	}

	orderId := req.OrderId
	if orderId <= 0 {
		orderId = 1001 // 默认初始订单号
	}

	var (
		userResp  *userClient.UserInfoResponse
		orderResp *orderClient.OrderResp
	)

	// 2. 核心演示：使用 go-zero mr.Finish 内网并发向下游微服务发起聚合请求，提升网关吞吐量
	err = mr.Finish(
		// 并发任务 1：请求 User RPC
		func() error {
			var rpcErr error
			userResp, rpcErr = l.svcCtx.UserRpc.GetUserInfo(l.ctx, &userClient.IdRequest{
				Id: userId,
			})
			return rpcErr
		},
		// 并发任务 2：请求 Order RPC
		func() error {
			var rpcErr error
			orderResp, rpcErr = l.svcCtx.OrderRpc.GetOrder(l.ctx, &orderClient.OrderReq{
				OrderId: orderId,
			})
			return rpcErr
		},
	)
	if err != nil {
		return nil, err
	}

	return &types.DashboardResp{
		UserInfo: types.UserInfoResp{
			Id:     userResp.Id,
			Name:   userResp.Name,
			Mobile: userResp.Mobile,
			Avatar: userResp.Avatar,
		},
		Order: types.OrderDetailResp{
			OrderId:  orderResp.OrderId,
			Item:     orderResp.Item,
			Amount:   orderResp.Amount,
			Status:   orderResp.Status,
			UserId:   userResp.Id,
			UserName: userResp.Name,
			Avatar:   userResp.Avatar,
		},
		SysTime: time.Now().UnixMilli(),
	}, nil
}

