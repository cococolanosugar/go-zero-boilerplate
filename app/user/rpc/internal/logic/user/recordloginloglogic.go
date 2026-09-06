package userlogic

import (
	"context"
	"time"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"

	"github.com/zeromicro/go-zero/core/logx"
)

type RecordLoginLogLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewRecordLoginLogLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RecordLoginLogLogic {
	return &RecordLoginLogLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *RecordLoginLogLogic) RecordLoginLog(in *pb.RecordLoginLogRequest) (*pb.EmptyResponse, error) {
	logItem := &model.SysLoginLog{
		Username:  in.Username,
		LoginIp:   in.LoginIp,
		Browser:   in.Browser,
		Os:        in.Os,
		Status:    int64(in.Status),
		Msg:       in.Msg,
		LoginTime: time.Now(),
	}

	if _, err := l.svcCtx.SysLoginLogModel.Insert(l.ctx, logItem); err != nil {
		l.Errorf("Insert sys_login_log err: %v", err)
		return nil, err
	}

	return &pb.EmptyResponse{}, nil
}
