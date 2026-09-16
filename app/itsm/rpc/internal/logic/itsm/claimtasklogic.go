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

type ClaimTaskLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewClaimTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ClaimTaskLogic {
	return &ClaimTaskLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ClaimTaskLogic) ClaimTask(in *itsm.ClaimTaskReq) (*itsm.CommonResp, error) {
	task, err := l.svcCtx.TaskModel.FindOne(l.ctx, in.TaskId)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ItsmTaskNotFound)
	}
	if task.Status != "READY" {
		return nil, xerr.NewErrCode(xerr.ItsmTaskAlreadyClaimed)
	}

	now := time.Now()
	task.Status = "CLAIMED"
	task.AssigneeId = sql.NullInt64{Int64: in.UserId, Valid: true}
	task.ClaimAt = sql.NullTime{Time: now, Valid: true}

	if err := l.svcCtx.TaskModel.Update(l.ctx, task); err != nil {
		return nil, err
	}

	// 更新首次响应时效 (首次认领即算响应)
	inst, err := l.svcCtx.ProcessInstModel.FindOne(l.ctx, task.InstId)
	if err == nil && inst != nil && !inst.FirstResponseAt.Valid {
		inst.FirstResponseAt = sql.NullTime{Time: now, Valid: true}
		_ = l.svcCtx.ProcessInstModel.Update(l.ctx, inst)
	}

	// 记录操作审计日志
	_, _ = l.svcCtx.TaskLogModel.Insert(l.ctx, &model.ItsmTaskLog{
		InstId:       task.InstId,
		TaskId:       sql.NullInt64{Int64: task.Id, Valid: true},
		NodeId:       task.NodeId,
		NodeName:     task.NodeName,
		OperatorId:   in.UserId,
		OperatorName: in.UserName,
		ActionType:   "CLAIM",
		Opinion:      sql.NullString{String: "认领任务", Valid: true},
		DurationSec:  0,
		CreateTime:   now,
	})

	return &itsm.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
