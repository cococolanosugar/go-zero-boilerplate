package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type AuditReleaseOrderLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewAuditReleaseOrderLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AuditReleaseOrderLogic {
	return &AuditReleaseOrderLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *AuditReleaseOrderLogic) AuditReleaseOrder(in *titan.AuditReleaseOrderReq) (*titan.CommonResp, error) {
	if in.Id <= 0 {
		return nil, xerr.NewErrMsg("发布单ID必须大于0")
	}

	order, err := l.svcCtx.ReleaseOrderModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "发布单")
	}

	if order.Status != "PENDING_APPROVAL" {
		return nil, xerr.NewErrMsg("仅待审批状态的发布单允许执行审批操作，当前状态: " + order.Status)
	}

	if in.Approved {
		order.Status = "APPROVED"
	} else {
		order.Status = "REJECTED"
	}
	order.ApproverId = in.ApproverId
	order.ApproverName = in.ApproverName

	if err := l.svcCtx.ReleaseOrderModel.Update(l.ctx, order); err != nil {
		return nil, xerr.NewErrMsg("更新发布单审批状态失败: " + err.Error())
	}

	return &titan.CommonResp{Code: 200, Msg: "审批成功"}, nil
}
