package titan

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateReleaseOrderLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateReleaseOrderLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateReleaseOrderLogic {
	return &CreateReleaseOrderLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateReleaseOrderLogic) CreateReleaseOrder(req *types.CreateReleaseOrderReqVO) (resp *types.CreateReleaseOrderRespVO, err error) {
	userId := getUserIdFromCtx(l.ctx)
	if userId <= 0 {
		userId = 1
	}

	rpcResp, err := l.svcCtx.TitanRpc.CreateReleaseOrder(l.ctx, &titan.CreateReleaseOrderReq{
		ProjectId:     req.ProjectId,
		Title:         req.Title,
		Description:   req.Description,
		TargetEnv:     req.TargetEnv,
		ServicesJson:  req.ServicesJson,
		ScheduledTime: req.ScheduledTime,
		ApplicantId:   userId,
		ApplicantName: "系统操作员",
	})
	if err != nil {
		return nil, err
	}

	return &types.CreateReleaseOrderRespVO{
		Id:                rpcResp.Id,
		OrderNo:           rpcResp.OrderNo,
		Status:            rpcResp.Status,
		ItsmProcessInstId: rpcResp.ItsmProcessInstId,
	}, nil
}
