package itsmlogic

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"go-zero-boilerplate/app/itsm/model"
	"go-zero-boilerplate/app/itsm/rpc/internal/svc"
	"go-zero-boilerplate/app/itsm/rpc/itsm"

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
		return nil, errors.New("ticket not found")
	}

	now := time.Now()
	inst.Status = "REVOKED"
	inst.CurrentNodeName = "已撤销"
	inst.UpdateTime = now
	if err := l.svcCtx.ProcessInstModel.Update(l.ctx, inst); err != nil {
		return nil, err
	}

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
