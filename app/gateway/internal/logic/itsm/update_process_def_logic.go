package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateProcessDefLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateProcessDefLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateProcessDefLogic {
	return &UpdateProcessDefLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateProcessDefLogic) UpdateProcessDef(req *types.UpdateProcessDefReqVO) error {
	_, err := l.svcCtx.ItsmRpc.UpdateProcessDef(l.ctx, &itsm.UpdateProcessDefReq{
		Id:          req.Id,
		ProcName:    req.ProcName,
		Category:    req.Category,
		BpmnXml:     req.BpmnXml,
		FormSchema:  req.FormSchema,
		Description: req.Description,
		Status:      req.Status,
	})
	return err
}
