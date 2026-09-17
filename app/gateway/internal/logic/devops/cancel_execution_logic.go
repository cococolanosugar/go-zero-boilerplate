package devops

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CancelExecutionLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCancelExecutionLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CancelExecutionLogic {
	return &CancelExecutionLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CancelExecutionLogic) CancelExecution(req *types.CancelExecutionReqVO) error {
	userId := getUserIdFromCtx(l.ctx)
	_, err := l.svcCtx.DevopsRpc.CancelExecution(l.ctx, &devops.CancelExecutionReq{
		ExecId: req.Id,
		UserId: userId,
	})
	return err
}
