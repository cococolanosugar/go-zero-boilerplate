package itsm

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetTicketTrajectoryLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetTicketTrajectoryLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTicketTrajectoryLogic {
	return &GetTicketTrajectoryLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetTicketTrajectoryLogic) GetTicketTrajectory(req *types.GetTicketTrajectoryReqVO) (resp *types.TicketTrajectoryRespVO, err error) {
	rpcResp, err := l.svcCtx.ItsmRpc.GetTicketTrajectory(l.ctx, &itsm.GetTicketTrajectoryReq{
		TicketId: req.Id,
	})
	if err != nil {
		return nil, err
	}

	var logs []types.TaskLogVO
	for _, lItem := range rpcResp.Logs {
		logs = append(logs, types.TaskLogVO{
			Id:           lItem.Id,
			TaskId:       lItem.TaskId,
			NodeId:       lItem.NodeId,
			NodeName:     lItem.NodeName,
			OperatorId:   lItem.OperatorId,
			OperatorName: lItem.OperatorName,
			ActionType:   lItem.ActionType,
			Opinion:      lItem.Opinion,
			DurationSec:  lItem.DurationSec,
			CreateTime:   lItem.CreateTime,
		})
	}

	return &types.TicketTrajectoryRespVO{
		BpmnXml:          rpcResp.BpmnXml,
		CompletedNodeIds: rpcResp.CompletedNodeIds,
		ActiveNodeIds:    rpcResp.ActiveNodeIds,
		RejectedNodeIds:  rpcResp.RejectedNodeIds,
		Logs:             logs,
	}, nil
}
