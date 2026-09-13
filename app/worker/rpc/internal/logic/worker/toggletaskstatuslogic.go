package workerlogic

import (
	"context"

	"go-zero-boilerplate/app/worker/model"
	"go-zero-boilerplate/app/worker/rpc/internal/svc"
	"go-zero-boilerplate/app/worker/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ToggleTaskStatusLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewToggleTaskStatusLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ToggleTaskStatusLogic {
	return &ToggleTaskStatusLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ToggleTaskStatusLogic) ToggleTaskStatus(in *pb.ToggleTaskStatusReq) (*pb.ToggleTaskStatusResp, error) {
	task, err := l.svcCtx.SysAsyncTaskModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewErrCode(xerr.RecordNotFound)
		}
		l.Logger.Errorf("SysAsyncTaskModel.FindOne error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	task.Status = in.Status
	err = l.svcCtx.SysAsyncTaskModel.UpdateStatus(l.ctx, in.Id, in.Status)
	if err != nil {
		l.Logger.Errorf("SysAsyncTaskModel.UpdateStatus error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// Sync Temporal schedule pause/unpause
	if task.CronExpr != "" {
		if syncErr := syncTemporalSchedule(l.ctx, l.svcCtx.TemporalClient, task); syncErr != nil {
			l.Logger.Errorf("syncTemporalSchedule failed: %v", syncErr)
		}
	}

	return &pb.ToggleTaskStatusResp{Success: true}, nil
}
