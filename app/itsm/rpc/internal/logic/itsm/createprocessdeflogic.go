package itsmlogic

import (
	"context"
	"errors"
	"time"

	"go-zero-boilerplate/app/itsm/model"
	"go-zero-boilerplate/app/itsm/rpc/internal/engine"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateProcessDefLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateProcessDefLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateProcessDefLogic {
	return &CreateProcessDefLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateProcessDefLogic) CreateProcessDef(in *itsm.CreateProcessDefReq) (*itsm.CreateProcessDefResp, error) {
	if in.ProcCode == "" || in.ProcName == "" {
		return nil, errors.New("procCode and procName are required")
	}

	// 校验 BPMN XML 拓扑结构合法性
	if in.BpmnXml != "" {
		if _, err := engine.ParseBPMNXML(in.BpmnXml); err != nil {
			return nil, err
		}
	}

	formSchema := in.FormSchema
	if formSchema == "" {
		formSchema = "{}"
	}

	data := &model.ItsmProcessDef{
		ProcCode:    in.ProcCode,
		ProcName:    in.ProcName,
		Category:    in.Category,
		BpmnXml:     in.BpmnXml,
		FormSchema:  formSchema,
		Version:     1,
		Status:      1, // 草稿
		Description: in.Description,
		CreatedBy:   in.CreatedBy,
		CreateTime:  time.Now(),
		UpdateTime:  time.Now(),
	}

	res, err := l.svcCtx.ProcessDefModel.Insert(l.ctx, data)
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &itsm.CreateProcessDefResp{Id: id}, nil
}
