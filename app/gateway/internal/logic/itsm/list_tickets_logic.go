package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListTicketsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListTicketsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListTicketsLogic {
	return &ListTicketsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListTicketsLogic) ListTickets(req *types.ListTicketsReqVO) (resp *types.ListTicketsRespVO, err error) {
	userId := getUserIdFromCtx(l.ctx)

	rpcResp, err := l.svcCtx.ItsmRpc.ListTickets(l.ctx, &itsm.ListTicketsReq{
		Page:     req.Page,
		PageSize: req.PageSize,
		ViewType: req.ViewType,
		UserId:   userId,
		Status:   req.Status,
		Priority: req.Priority,
		Keyword:  req.Keyword,
	})
	if err != nil {
		return nil, err
	}

	var list []types.TicketVO
	for _, item := range rpcResp.List {
		list = append(list, types.TicketVO{
			Id:                  item.Id,
			TicketNo:            item.TicketNo,
			Title:               item.Title,
			Priority:            item.Priority,
			ProcDefId:           item.ProcDefId,
			ProcName:            item.ProcName,
			InitiatorId:         item.InitiatorId,
			InitiatorName:       item.InitiatorName,
			CurrentNodeId:       item.CurrentNodeId,
			CurrentNodeName:     item.CurrentNodeName,
			Status:              item.Status,
			SlaStatus:           item.SlaStatus,
			SlaResponseDeadline: item.SlaResponseDeadline,
			SlaResolveDeadline:  item.SlaResolveDeadline,
			CreateTime:          item.CreateTime,
		})
	}

	return &types.ListTicketsRespVO{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
