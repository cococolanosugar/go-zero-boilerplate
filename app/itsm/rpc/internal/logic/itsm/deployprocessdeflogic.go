package itsmlogic

import (
	"context"
	"errors"
	"time"

	"go-zero-boilerplate/app/itsm/rpc/internal/engine"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeployProcessDefLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeployProcessDefLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeployProcessDefLogic {
	return &DeployProcessDefLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeployProcessDefLogic) DeployProcessDef(in *itsm.DeployProcessDefReq) (*itsm.CommonResp, error) {
	record, err := l.svcCtx.ProcessDefModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, err
	}

	if record.BpmnXml == "" {
		return nil, errors.New("cannot deploy process definition with empty bpmn xml")
	}

	// 部署前严格校验 BPMN 图形拓扑连通性
	if _, err := engine.ParseBPMNXML(record.BpmnXml); err != nil {
		return nil, err
	}

	record.Status = 2 // 2: 已发布
	record.UpdateTime = time.Now()

	if err := l.svcCtx.ProcessDefModel.Update(l.ctx, record); err != nil {
		return nil, err
	}

	return &itsm.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
