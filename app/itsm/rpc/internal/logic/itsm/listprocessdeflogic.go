package itsmlogic

import (
	"context"

	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListProcessDefLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListProcessDefLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListProcessDefLogic {
	return &ListProcessDefLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListProcessDefLogic) ListProcessDef(in *itsm.ListProcessDefReq) (*itsm.ListProcessDefResp, error) {
	page := in.Page
	if page < 1 {
		page = 1
	}
	pageSize := in.PageSize
	if pageSize < 1 {
		pageSize = 10
	}

	list, total, err := l.svcCtx.ProcessDefModel.FindPageList(l.ctx, page, pageSize, in.Category, in.Status, in.Keyword)
	if err != nil {
		return nil, err
	}

	var items []*itsm.ProcessDefItem
	for _, item := range list {
		items = append(items, &itsm.ProcessDefItem{
			Id:          item.Id,
			ProcCode:    item.ProcCode,
			ProcName:    item.ProcName,
			Category:    item.Category,
			BpmnXml:     item.BpmnXml,
			FormSchema:  item.FormSchema,
			Version:     int32(item.Version),
			Status:      int32(item.Status),
			Description: item.Description,
			CreateTime:  item.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:  item.UpdateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &itsm.ListProcessDefResp{
		Total: total,
		List:  items,
	}, nil
}
