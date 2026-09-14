package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateProcessDefLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateProcessDefLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateProcessDefLogic {
	return &CreateProcessDefLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateProcessDefLogic) CreateProcessDef(req *types.CreateProcessDefReqVO) (resp *types.CreateTicketRespVO, err error) {
	userId := getUserIdFromCtx(l.ctx)

	rpcResp, err := l.svcCtx.ItsmRpc.CreateProcessDef(l.ctx, &itsm.CreateProcessDefReq{
		ProcCode:    req.ProcCode,
		ProcName:    req.ProcName,
		Category:    req.Category,
		BpmnXml:     req.BpmnXml,
		FormSchema:  req.FormSchema,
		Description: req.Description,
		CreatedBy:   userId,
	})
	if err != nil {
		return nil, err
	}

	return &types.CreateTicketRespVO{
		Id: rpcResp.Id,
	}, nil
}
