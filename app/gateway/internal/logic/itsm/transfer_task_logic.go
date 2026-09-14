package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type TransferTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewTransferTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TransferTaskLogic {
	return &TransferTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *TransferTaskLogic) TransferTask(req *types.TransferTaskReqVO) error {
	userId := getUserIdFromCtx(l.ctx)

	_, err := l.svcCtx.ItsmRpc.TransferTask(l.ctx, &itsm.TransferTaskReq{
		TaskId:       req.TaskId,
		UserId:       userId,
		TargetUserId: req.TargetUserId,
		Opinion:      req.Opinion,
	})
	return err
}
