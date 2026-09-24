package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ApproveStepLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewApproveStepLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ApproveStepLogic {
	return &ApproveStepLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ApproveStepLogic) ApproveStep(req *types.ApproveStepReqVO) error {
	userId := getUserIdFromCtx(l.ctx)
	_, err := l.svcCtx.TitanRpc.ApproveStep(l.ctx, &titan.ApproveStepReq{
		StepExecId: req.Id,
		Approved:   req.Approved,
		UserId:     userId,
		Comment:    req.Comment,
	})
	return err
}
