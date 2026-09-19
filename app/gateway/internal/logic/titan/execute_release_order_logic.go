package titan

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type ExecuteReleaseOrderLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewExecuteReleaseOrderLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ExecuteReleaseOrderLogic {
	return &ExecuteReleaseOrderLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ExecuteReleaseOrderLogic) ExecuteReleaseOrder(req *types.ExecuteReleaseOrderReqVO) error {
	userId := getUserIdFromCtx(l.ctx)
	if userId <= 0 {
		userId = 1
	}

	_, err := l.svcCtx.TitanRpc.ExecuteReleaseOrder(l.ctx, &titan.ExecuteReleaseOrderReq{
		Id:           req.Id,
		OperatorId:   userId,
		OperatorName: "执行人",
	})
	return err
}
