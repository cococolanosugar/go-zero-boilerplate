package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
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
	_, err := l.svcCtx.TitanRpc.CancelExecution(l.ctx, &titan.CancelExecutionReq{
		ExecId: req.Id,
		UserId: userId,
	})
	return err
}
