package itsmlogic

import (
	"context"
	"time"

	"go-zero-boilerplate/app/itsm/rpc/internal/engine"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateProcessDefLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateProcessDefLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateProcessDefLogic {
	return &UpdateProcessDefLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateProcessDefLogic) UpdateProcessDef(in *itsm.UpdateProcessDefReq) (*itsm.CommonResp, error) {
	record, err := l.svcCtx.ProcessDefModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, err
	}

	if in.BpmnXml != "" {
		if _, err := engine.ParseBPMNXML(in.BpmnXml); err != nil {
			return nil, err
		}
		record.BpmnXml = in.BpmnXml
	}

	if in.ProcName != "" {
		record.ProcName = in.ProcName
	}
	if in.Category != "" {
		record.Category = in.Category
	}
	if in.FormSchema != "" {
		record.FormSchema = in.FormSchema
	}
	if in.Description != "" {
		record.Description = in.Description
	}
	if in.Status > 0 {
		record.Status = int64(in.Status)
	}
	record.UpdateTime = time.Now()

	if err := l.svcCtx.ProcessDefModel.Update(l.ctx, record); err != nil {
		return nil, err
	}

	return &itsm.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
