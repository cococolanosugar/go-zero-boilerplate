package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListProcessDefsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListProcessDefsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListProcessDefsLogic {
	return &ListProcessDefsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListProcessDefsLogic) ListProcessDefs(req *types.ListProcessDefsReq) (resp *types.ListProcessDefsResp, err error) {
	rpcResp, err := l.svcCtx.ItsmRpc.ListProcessDef(l.ctx, &itsm.ListProcessDefReq{
		Page:     req.Page,
		PageSize: req.PageSize,
		Category: req.Category,
		Status:   req.Status,
		Keyword:  req.Keyword,
	})
	if err != nil {
		return nil, err
	}

	var list []types.ProcessDefVO
	for _, item := range rpcResp.List {
		list = append(list, types.ProcessDefVO{
			Id:          item.Id,
			ProcCode:    item.ProcCode,
			ProcName:    item.ProcName,
			Category:    item.Category,
			BpmnXml:     item.BpmnXml,
			FormSchema:  item.FormSchema,
			Version:     item.Version,
			Status:      item.Status,
			Description: item.Description,
			CreateTime:  item.CreateTime,
			UpdateTime:  item.UpdateTime,
		})
	}

	return &types.ListProcessDefsResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
