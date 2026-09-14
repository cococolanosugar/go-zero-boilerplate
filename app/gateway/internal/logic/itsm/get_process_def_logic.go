package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetProcessDefLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetProcessDefLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetProcessDefLogic {
	return &GetProcessDefLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetProcessDefLogic) GetProcessDef(req *types.GetProcessDefReq) (resp *types.ProcessDefVO, err error) {
	rpcResp, err := l.svcCtx.ItsmRpc.GetProcessDef(l.ctx, &itsm.GetProcessDefReq{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.ProcessDefVO{
		Id:          rpcResp.Id,
		ProcCode:    rpcResp.ProcCode,
		ProcName:    rpcResp.ProcName,
		Category:    rpcResp.Category,
		BpmnXml:     rpcResp.BpmnXml,
		FormSchema:  rpcResp.FormSchema,
		Version:     rpcResp.Version,
		Status:      rpcResp.Status,
		Description: rpcResp.Description,
		CreateTime:  rpcResp.CreateTime,
		UpdateTime:  rpcResp.UpdateTime,
	}, nil
}
