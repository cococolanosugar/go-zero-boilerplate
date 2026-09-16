package itsmlogic

import (
	"context"
	"database/sql"
	"time"

	"go-zero-boilerplate/app/itsm/model"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type RejectTaskLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewRejectTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RejectTaskLogic {
	return &RejectTaskLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *RejectTaskLogic) RejectTask(in *itsm.RejectTaskReq) (*itsm.CommonResp, error) {
	task, err := l.svcCtx.TaskModel.FindOne(l.ctx, in.TaskId)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ItsmTaskNotFound)
	}
	if task.Status != "READY" && task.Status != "CLAIMED" {
		return nil, xerr.NewErrCode(xerr.ItsmTaskAlreadyDone)
	}

	// 越权防护：若任务已被指定/认领办理人，仅该办理人或超级管理员(ID: 1)可执行驳回
	if task.Status == "CLAIMED" && task.AssigneeId.Valid && task.AssigneeId.Int64 != in.UserId && in.UserId != 1 {
		return nil, xerr.NewErrCode(xerr.Forbidden)
	}
	inst, err := l.svcCtx.ProcessInstModel.FindOne(l.ctx, task.InstId)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ItsmInstanceNotFound)
	}

	now := time.Now()
	task.Status = "REJECTED"
	task.CompletedAt = sql.NullTime{Time: now, Valid: true}
	task.AssigneeId = sql.NullInt64{Int64: in.UserId, Valid: true}
	if err := l.svcCtx.TaskModel.Update(l.ctx, task); err != nil {
		return nil, err
	}

	// 记录驳回审计日志
	duration := int(now.Sub(task.CreateTime).Seconds())
	_, _ = l.svcCtx.TaskLogModel.Insert(l.ctx, &model.ItsmTaskLog{
		InstId:       task.InstId,
		TaskId:       sql.NullInt64{Int64: task.Id, Valid: true},
		NodeId:       task.NodeId,
		NodeName:     task.NodeName,
		OperatorId:   in.UserId,
		OperatorName: in.UserName,
		ActionType:   "REJECT",
		Opinion:      sql.NullString{String: in.Opinion, Valid: in.Opinion != ""},
		DurationSec:  int64(duration),
		CreateTime:   now,
	})

	inst.Status = "REJECTED"
	inst.CurrentNodeName = "已驳回"
	inst.UpdateTime = now
	if err := l.svcCtx.ProcessInstModel.Update(l.ctx, inst); err != nil {
		return nil, err
	}

	return &itsm.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
