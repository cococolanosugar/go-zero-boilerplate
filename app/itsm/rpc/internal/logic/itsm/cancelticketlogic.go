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

type CancelTicketLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCancelTicketLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CancelTicketLogic {
	return &CancelTicketLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CancelTicketLogic) CancelTicket(in *itsm.CancelTicketReq) (*itsm.CommonResp, error) {
	inst, err := l.svcCtx.ProcessInstModel.FindOne(l.ctx, in.TicketId)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ItsmTicketNotFound)
	}

	// 越权防护：仅工单发起人或超级管理员(ID: 1)有权撤回工单
	if inst.InitiatorId != in.UserId && in.UserId != 1 {
		return nil, xerr.NewErrCode(xerr.Forbidden)
	}

	// 状态校验：仅流转中的工单允许撤回
	if inst.Status != "RUNNING" && inst.Status != "PENDING" {
		return nil, xerr.NewErrMsg("当前工单状态不支持撤销")
	}

	now := time.Now()
	inst.Status = "REVOKED"
	inst.CurrentNodeName = "已撤销"
	inst.UpdateTime = now
	if err := l.svcCtx.ProcessInstModel.Update(l.ctx, inst); err != nil {
		return nil, err
	}

	// 级联将该工单下所有未完结的待办/办理中任务置为已取消
	cancelTaskSql := "UPDATE itsm_task SET status = 'CANCELLED' WHERE inst_id = ? AND status IN ('READY', 'CLAIMED')"
	_, _ = l.svcCtx.SqlConn.ExecCtx(l.ctx, cancelTaskSql, inst.Id)

	// 记录撤销审计日志
	_, _ = l.svcCtx.TaskLogModel.Insert(l.ctx, &model.ItsmTaskLog{
		InstId:       inst.Id,
		NodeId:       "cancel",
		NodeName:     "工单撤销",
		OperatorId:   in.UserId,
		OperatorName: in.UserName,
		ActionType:   "REVOKE",
		Opinion:      sql.NullString{String: in.Reason, Valid: in.Reason != ""},
		DurationSec:  0,
		CreateTime:   now,
	})

	return &itsm.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
