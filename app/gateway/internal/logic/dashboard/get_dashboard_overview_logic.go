package dashboard

import (
	"context"
	"encoding/json"
	"time"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"
	workerClient "go-zero-boilerplate/app/worker/rpc/client/worker"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/mr"
)

type GetDashboardOverviewLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取系统大盘聚合信息（mr.Finish 内网并发拉取用户画像与任务统计）
func NewGetDashboardOverviewLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetDashboardOverviewLogic {
	return &GetDashboardOverviewLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetDashboardOverviewLogic) GetDashboardOverview(req *types.DashboardReq) (resp *types.DashboardResp, err error) {
	// 1. 获取当前用户 ID（从 JWT 强制提取，杜绝越权）
	var userId int64
	if uidVal := l.ctx.Value("userId"); uidVal != nil {
		if uidJson, ok := uidVal.(json.Number); ok {
			if uidInt, err := uidJson.Int64(); err == nil {
				userId = uidInt
			}
		} else if uidInt, ok := uidVal.(int64); ok {
			userId = uidInt
		}
	}
	if userId <= 0 {
		return nil, xerr.NewErrCode(xerr.TokenExpireError)
	}

	var (
		userResp  *userClient.UserInfoResponse
		tasksResp *workerClient.ListTasksResp
	)

	// 2. 核心演示：使用 go-zero mr.Finish 内网并发向下游微服务发起聚合请求，提升网关吞吐量
	err = mr.Finish(
		// 并发任务 1：请求 User RPC 拉取当前登录用户画像
		func() error {
			var rpcErr error
			userResp, rpcErr = l.svcCtx.UserRpc.GetUserInfo(l.ctx, &userClient.IdRequest{
				Id: userId,
			})
			return rpcErr
		},
		// 并发任务 2：请求 Worker RPC 拉取系统异步任务执行概览
		func() error {
			var rpcErr error
			tasksResp, rpcErr = l.svcCtx.WorkerRpc.ListTasks(l.ctx, &workerClient.ListTasksReq{
				Page:     1,
				PageSize: 100,
			})
			if rpcErr != nil {
				// 降级容灾：若 Worker 暂时不可达，不阻断主大盘渲染
				l.Logger.Errorf("WorkerRpc.ListTasks failed in dashboard aggregation: %v", rpcErr)
				return nil
			}
			return nil
		},
	)
	if err != nil {
		return nil, err
	}

	var activeTasks, completedTasks int64
	if tasksResp != nil {
		for _, task := range tasksResp.List {
			if task.Status == 1 {
				activeTasks++
			}
			if task.LastRunStatus == "SUCCESS" || task.LastRunStatus == "COMPLETED" {
				completedTasks++
			}
		}
	}

	return &types.DashboardResp{
		UserInfo: types.UserInfoResp{
			Id:     userResp.Id,
			Name:   userResp.Name,
			Mobile: userResp.Mobile,
			Avatar: userResp.Avatar,
		},
		SystemStats: types.DashboardSystemStats{
			TotalUsers:     128,
			ActiveTasks:    activeTasks,
			CompletedTasks: completedTasks,
			SuccessRate:    99.8,
		},
		SysTime: time.Now().UnixMilli(),
	}, nil
}
