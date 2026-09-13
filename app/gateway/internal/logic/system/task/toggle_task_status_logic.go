package task

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	workerClient "go-zero-boilerplate/app/worker/rpc/client/worker"

	"github.com/zeromicro/go-zero/core/logx"
)

type ToggleTaskStatusLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 启停异步任务
func NewToggleTaskStatusLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ToggleTaskStatusLogic {
	return &ToggleTaskStatusLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ToggleTaskStatusLogic) ToggleTaskStatus(req *types.ToggleTaskStatusReq) (resp *types.ToggleTaskStatusResp, err error) {
	rpcResp, err := l.svcCtx.WorkerRpc.ToggleTaskStatus(l.ctx, &workerClient.ToggleTaskStatusReq{
		Id:     req.Id,
		Status: req.Status,
	})
	if err != nil {
		return nil, err
	}

	return &types.ToggleTaskStatusResp{
		Success: rpcResp.Success,
	}, nil
}
