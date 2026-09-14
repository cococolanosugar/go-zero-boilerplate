package itsmlogic

import (
	"context"
	"errors"

	"go-zero-boilerplate/app/itsm/model"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetProcessDefLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetProcessDefLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetProcessDefLogic {
	return &GetProcessDefLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetProcessDefLogic) GetProcessDef(in *itsm.GetProcessDefReq) (*itsm.ProcessDefItem, error) {
	var record *model.ItsmProcessDef
	var err error

	if in.Id > 0 {
		record, err = l.svcCtx.ProcessDefModel.FindOne(l.ctx, in.Id)
	} else if in.ProcCode != "" {
		record, err = l.svcCtx.ProcessDefModel.FindLatestByProcCode(l.ctx, in.ProcCode)
	} else {
		return nil, errors.New("id or procCode is required")
	}

	if err != nil {
		return nil, err
	}

	return &itsm.ProcessDefItem{
		Id:          record.Id,
		ProcCode:    record.ProcCode,
		ProcName:    record.ProcName,
		Category:    record.Category,
		BpmnXml:     record.BpmnXml,
		FormSchema:  record.FormSchema,
		Version:     int32(record.Version),
		Status:      int32(record.Status),
		Description: record.Description,
		CreateTime:  record.CreateTime.Format("2006-01-02 15:04:05"),
		UpdateTime:  record.UpdateTime.Format("2006-01-02 15:04:05"),
	}, nil
}
