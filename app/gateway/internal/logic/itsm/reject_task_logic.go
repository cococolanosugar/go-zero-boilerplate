package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type RejectTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewRejectTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RejectTaskLogic {
	return &RejectTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RejectTaskLogic) RejectTask(req *types.RejectTaskReqVO) error {
	userId := getUserIdFromCtx(l.ctx)

	_, err := l.svcCtx.ItsmRpc.RejectTask(l.ctx, &itsm.RejectTaskReq{
		TaskId:  req.TaskId,
		UserId:  userId,
		Opinion: req.Opinion,
	})
	return err
}
