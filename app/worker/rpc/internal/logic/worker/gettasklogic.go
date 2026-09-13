package workerlogic

import (
	"context"

	"go-zero-boilerplate/app/worker/model"
	"go-zero-boilerplate/app/worker/rpc/internal/svc"
	"go-zero-boilerplate/app/worker/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetTaskLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTaskLogic {
	return &GetTaskLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetTaskLogic) GetTask(in *pb.GetTaskReq) (*pb.AsyncTaskItem, error) {
	task, err := l.svcCtx.SysAsyncTaskModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewErrCode(xerr.RecordNotFound)
		}
		l.Logger.Errorf("SysAsyncTaskModel.FindOne error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return toPbTask(task), nil
}
