package workerlogic

import (
	"context"

	"go-zero-boilerplate/app/worker/rpc/internal/svc"
	"go-zero-boilerplate/app/worker/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListTasksLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListTasksLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListTasksLogic {
	return &ListTasksLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// 异步任务调度与管理
func (l *ListTasksLogic) ListTasks(in *pb.ListTasksReq) (*pb.ListTasksResp, error) {
	list, total, err := l.svcCtx.SysAsyncTaskModel.FindPageList(l.ctx, in.Page, in.PageSize, in.TaskName, in.TaskKey, in.Status)
	if err != nil {
		l.Logger.Errorf("SysAsyncTaskModel.FindPageList error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	items := make([]*pb.AsyncTaskItem, 0, len(list))
	for _, item := range list {
		items = append(items, toPbTask(item))
	}

	return &pb.ListTasksResp{
		Total: total,
		List:  items,
	}, nil
}
