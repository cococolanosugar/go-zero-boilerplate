package itsmlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListTicketsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListTicketsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListTicketsLogic {
	return &ListTicketsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListTicketsLogic) ListTickets(in *itsm.ListTicketsReq) (*itsm.ListTicketsResp, error) {
	page := in.Page
	if page < 1 {
		page = 1
	}
	pageSize := in.PageSize
	if pageSize < 1 {
		pageSize = 10
	}

	list, total, err := l.svcCtx.ProcessInstModel.FindPageList(
		l.ctx, page, pageSize, in.ViewType, in.UserId, in.Status, in.Priority, in.Keyword,
	)
	if err != nil {
		return nil, err
	}

	// 批量拉取流程定义名称映射
	procNameMap := make(map[int64]string)
	for _, item := range list {
		if _, ok := procNameMap[item.ProcDefId]; !ok {
			if def, err := l.svcCtx.ProcessDefModel.FindOne(l.ctx, item.ProcDefId); err == nil && def != nil {
				procNameMap[item.ProcDefId] = def.ProcName
			}
		}
	}

	var items []*itsm.TicketItem
	for _, item := range list {
		respDeadline := ""
		if item.SlaResponseDeadline.Valid {
			respDeadline = item.SlaResponseDeadline.Time.Format("2006-01-02 15:04:05")
		}
		resolveDeadline := ""
		if item.SlaResolveDeadline.Valid {
			resolveDeadline = item.SlaResolveDeadline.Time.Format("2006-01-02 15:04:05")
		}

		items = append(items, &itsm.TicketItem{
			Id:                  item.Id,
			TicketNo:            item.TicketNo,
			Title:               item.Title,
			Priority:            item.Priority,
			ProcDefId:           item.ProcDefId,
			ProcName:            procNameMap[item.ProcDefId],
			InitiatorId:         item.InitiatorId,
			InitiatorName:       fmt.Sprintf("用户%d", item.InitiatorId),
			CurrentNodeId:       item.CurrentNodeId,
			CurrentNodeName:     item.CurrentNodeName,
			Status:              item.Status,
			SlaStatus:           item.SlaStatus,
			SlaResponseDeadline: respDeadline,
			SlaResolveDeadline:  resolveDeadline,
			CreateTime:          item.CreateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &itsm.ListTicketsResp{
		Total: total,
		List:  items,
	}, nil
}
