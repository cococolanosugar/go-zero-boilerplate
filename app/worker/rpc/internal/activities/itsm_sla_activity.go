package activities

import (
	"context"
	"database/sql"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ItsmSlaActivities struct {
	conn sqlx.SqlConn
}

func NewItsmSlaActivities(conn sqlx.SqlConn) *ItsmSlaActivities {
	return &ItsmSlaActivities{conn: conn}
}

// CheckResponseSla 检查首次响应 SLA 达成情况
func (a *ItsmSlaActivities) CheckResponseSla(ctx context.Context, ticketId int64) (string, error) {
	logx.WithContext(ctx).Infof("[ITSM SLA Activity] Checking response SLA for ticket ID: %d", ticketId)

	type ticketInfo struct {
		FirstResponseAt sql.NullTime `db:"first_response_at"`
		Status          string       `db:"status"`
	}

	var info ticketInfo
	query := "SELECT first_response_at, status FROM itsm_process_inst WHERE id = ? LIMIT 1"
	err := a.conn.QueryRowCtx(ctx, &info, query, ticketId)
	if err != nil {
		logx.WithContext(ctx).Errorf("failed to query ticket %d: %v", ticketId, err)
		return "ERROR", err
	}

	// 若仍在流转中且未产生首次响应，则标记 SLA 为 WARNING 预警
	if info.Status == "RUNNING" && !info.FirstResponseAt.Valid {
		logx.WithContext(ctx).Infof("[ITSM SLA Activity] Ticket %d breached response SLA, marking as WARNING", ticketId)
		updateQuery := "UPDATE itsm_process_inst SET sla_status = 'WARNING' WHERE id = ? AND sla_status = 'NORMAL'"
		_, _ = a.conn.ExecCtx(ctx, updateQuery, ticketId)
		return "RESPONSE_WARNING", nil
	}

	return "RESPONSE_OK", nil
}

// CheckResolveSla 检查最终解决 SLA 达成情况
func (a *ItsmSlaActivities) CheckResolveSla(ctx context.Context, ticketId int64) (string, error) {
	logx.WithContext(ctx).Infof("[ITSM SLA Activity] Checking resolve SLA for ticket ID: %d", ticketId)

	var status string
	query := "SELECT status FROM itsm_process_inst WHERE id = ? LIMIT 1"
	err := a.conn.QueryRowCtx(ctx, &status, query, ticketId)
	if err != nil {
		logx.WithContext(ctx).Errorf("failed to query ticket %d: %v", ticketId, err)
		return "ERROR", err
	}

	// 若超过解决时限仍在流转中，标记 SLA 为 BREACHED 违约
	if status == "RUNNING" {
		logx.WithContext(ctx).Infof("[ITSM SLA Activity] Ticket %d breached resolve SLA, marking as BREACHED", ticketId)
		updateQuery := "UPDATE itsm_process_inst SET sla_status = 'BREACHED' WHERE id = ?"
		_, _ = a.conn.ExecCtx(ctx, updateQuery, ticketId)
		return "RESOLVE_BREACHED", nil
	}

	return "RESOLVE_OK", nil
}
