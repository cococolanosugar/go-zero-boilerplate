package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"

	"github.com/zeromicro/go-zero/core/logx"
)

type RecordOperLogLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewRecordOperLogLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RecordOperLogLogic {
	return &RecordOperLogLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *RecordOperLogLogic) RecordOperLog(in *pb.RecordOperLogRequest) (*pb.EmptyResponse, error) {
	operLog := &model.SysOperLog{
		Title:      in.Title,
		OperName:   in.OperName,
		OperUrl:    in.OperUrl,
		OperMethod: in.OperMethod,
		OperIp:     in.OperIp,
		Status:     int64(in.Status),
		ErrorMsg:   in.ErrorMsg,
		CostTime:   in.CostTime,
	}

	if _, err := l.svcCtx.SysOperLogModel.Insert(l.ctx, operLog); err != nil {
		l.Errorf("Insert sys_oper_log err: %v", err)
		return nil, err
	}

	return &pb.EmptyResponse{}, nil
}
