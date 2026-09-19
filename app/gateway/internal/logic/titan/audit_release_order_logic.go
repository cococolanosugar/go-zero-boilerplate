package titan

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type AuditReleaseOrderLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewAuditReleaseOrderLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AuditReleaseOrderLogic {
	return &AuditReleaseOrderLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *AuditReleaseOrderLogic) AuditReleaseOrder(req *types.AuditReleaseOrderReqVO) error {
	userId := getUserIdFromCtx(l.ctx)
	if userId <= 0 {
		userId = 1
	}

	_, err := l.svcCtx.TitanRpc.AuditReleaseOrder(l.ctx, &titan.AuditReleaseOrderReq{
		Id:           req.Id,
		Approved:     req.Approved,
		Comment:      req.Comment,
		ApproverId:   userId,
		ApproverName: "审批人",
	})
	return err
}
