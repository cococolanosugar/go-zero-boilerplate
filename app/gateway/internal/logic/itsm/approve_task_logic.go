package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type ApproveTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewApproveTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ApproveTaskLogic {
	return &ApproveTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ApproveTaskLogic) ApproveTask(req *types.ApproveTaskReqVO) error {
	userId := getUserIdFromCtx(l.ctx)

	_, err := l.svcCtx.ItsmRpc.ApproveTask(l.ctx, &itsm.ApproveTaskReq{
		TaskId:              req.TaskId,
		UserId:              userId,
		Opinion:             req.Opinion,
		UpdatedFormDataJson: req.UpdatedFormDataJson,
	})
	return err
}
