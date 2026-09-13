package workerlogic

import (
	"context"

	"go-zero-boilerplate/app/worker/model"
	"go-zero-boilerplate/app/worker/rpc/internal/svc"
	"go-zero-boilerplate/app/worker/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteTaskLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteTaskLogic {
	return &DeleteTaskLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteTaskLogic) DeleteTask(in *pb.DeleteTaskReq) (*pb.DeleteTaskResp, error) {
	task, err := l.svcCtx.SysAsyncTaskModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return &pb.DeleteTaskResp{Success: true}, nil
		}
		l.Logger.Errorf("SysAsyncTaskModel.FindOne error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// Delete from Temporal schedule
	deleteTemporalSchedule(l.ctx, l.svcCtx.TemporalClient, task.TaskKey)

	// Delete from DB
	if err := l.svcCtx.SysAsyncTaskModel.Delete(l.ctx, in.Id); err != nil {
		l.Logger.Errorf("SysAsyncTaskModel.Delete error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.DeleteTaskResp{Success: true}, nil
}
