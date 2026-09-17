package itsmlogic

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"go-zero-boilerplate/app/itsm/model"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type TransferTaskLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewTransferTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TransferTaskLogic {
	return &TransferTaskLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *TransferTaskLogic) TransferTask(in *itsm.TransferTaskReq) (*itsm.CommonResp, error) {
	task, err := l.svcCtx.TaskModel.FindOne(l.ctx, in.TaskId)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ItsmTaskNotFound)
	}

	if task.Status != "READY" && task.Status != "CLAIMED" {
		return nil, xerr.NewErrMsg("当前任务已处于办结或终止状态，不可转派")
	}
	if task.Status == "CLAIMED" && task.AssigneeId.Valid && task.AssigneeId.Int64 != in.UserId && in.UserId != 1 {
		return nil, xerr.NewErrCode(xerr.Forbidden)
	}

	now := time.Now()
	task.AssigneeId = sql.NullInt64{Int64: in.TargetUserId, Valid: true}
	task.Status = "READY" // 转办后处于待目标人认领/办理状态
	if err := l.svcCtx.TaskModel.Update(l.ctx, task); err != nil {
		return nil, err
	}

	// 记录转办审计日志
	opinion := fmt.Sprintf("转派给用户 [%s(ID:%d)] 处理。意见: %s", in.TargetUserName, in.TargetUserId, in.Opinion)
	_, _ = l.svcCtx.TaskLogModel.Insert(l.ctx, &model.ItsmTaskLog{
		InstId:       task.InstId,
		TaskId:       sql.NullInt64{Int64: task.Id, Valid: true},
		NodeId:       task.NodeId,
		NodeName:     task.NodeName,
		OperatorId:   in.UserId,
		OperatorName: in.UserName,
		ActionType:   "TRANSFER",
		Opinion:      sql.NullString{String: opinion, Valid: true},
		DurationSec:  0,
		CreateTime:   now,
	})

	return &itsm.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
