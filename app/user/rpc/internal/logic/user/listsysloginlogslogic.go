package userlogic

import (
	"context"
	"fmt"
	"strings"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysLoginLogsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysLoginLogsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysLoginLogsLogic {
	return &ListSysLoginLogsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSysLoginLogsLogic) ListSysLoginLogs(in *pb.ListSysLoginLogsRequest) (*pb.ListSysLoginLogsResponse, error) {
	page := in.Page
	if page <= 0 {
		page = 1
	}
	pageSize := in.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	var whereClauses []string
	if len(strings.TrimSpace(in.Username)) > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("username LIKE '%%%s%%'", strings.TrimSpace(in.Username)))
	}
	if in.Status > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("status = %d", in.Status))
	}

	whereSql := ""
	if len(whereClauses) > 0 {
		whereSql = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	countSql := fmt.Sprintf("SELECT COUNT(*) FROM sys_login_log %s", whereSql)
	var total int64
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countSql); err != nil {
		l.Errorf("Count sys_login_log err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	querySql := fmt.Sprintf(`
		SELECT id, username, login_ip, browser, os, status, msg, login_time
		FROM sys_login_log
		%s
		ORDER BY id DESC
		LIMIT %d, %d
	`, whereSql, offset, pageSize)

	type loginLogRow struct {
		Id        int64  `db:"id"`
		Username  string `db:"username"`
		LoginIp   string `db:"login_ip"`
		Browser   string `db:"browser"`
		Os        string `db:"os"`
		Status    int32  `db:"status"`
		Msg       string `db:"msg"`
		LoginTime string `db:"login_time"`
	}

	var rows []loginLogRow
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &rows, querySql); err != nil {
		l.Errorf("Query sys_login_log rows err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	var list []*pb.SysLoginLogItem
	for _, r := range rows {
		list = append(list, &pb.SysLoginLogItem{
			Id:        r.Id,
			Username:  r.Username,
			LoginIp:   r.LoginIp,
			Browser:   r.Browser,
			Os:        r.Os,
			Status:    r.Status,
			Msg:       r.Msg,
			LoginTime: r.LoginTime,
		})
	}

	return &pb.ListSysLoginLogsResponse{
		Total: total,
		List:  list,
	}, nil
}
