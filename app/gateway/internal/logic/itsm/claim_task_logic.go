package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type ClaimTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewClaimTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ClaimTaskLogic {
	return &ClaimTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ClaimTaskLogic) ClaimTask(req *types.ClaimTaskReqVO) error {
	userId := getUserIdFromCtx(l.ctx)

	_, err := l.svcCtx.ItsmRpc.ClaimTask(l.ctx, &itsm.ClaimTaskReq{
		TaskId: req.TaskId,
		UserId: userId,
	})
	return err
}
