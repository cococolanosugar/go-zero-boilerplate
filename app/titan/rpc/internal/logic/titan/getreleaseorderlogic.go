package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/itsm/rpc/itsm"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetReleaseOrderLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetReleaseOrderLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetReleaseOrderLogic {
	return &GetReleaseOrderLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetReleaseOrderLogic) GetReleaseOrder(in *titan.GetReleaseOrderReq) (*titan.ReleaseOrderDetailResp, error) {
	if in.Id <= 0 {
		return nil, xerr.NewErrMsg("发布单ID必须大于0")
	}

	order, err := l.svcCtx.ReleaseOrderModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "发布单")
	}

	itsmStatus := ""
	if order.ItsmProcessInstId > 0 && l.svcCtx.ItsmRpc != nil {
		ticketDetail, err := l.svcCtx.ItsmRpc.GetTicketDetail(l.ctx, &itsm.GetTicketDetailReq{
			Id: order.ItsmProcessInstId,
		})
		if err == nil && ticketDetail != nil && ticketDetail.Ticket != nil {
			itsmStatus = ticketDetail.Ticket.Status
		}
	}

	return &titan.ReleaseOrderDetailResp{
		Order:      formatOrderModel(order),
		ItsmStatus: itsmStatus,
	}, nil
}
