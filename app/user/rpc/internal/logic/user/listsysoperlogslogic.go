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

type ListSysOperLogsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysOperLogsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysOperLogsLogic {
	return &ListSysOperLogsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSysOperLogsLogic) ListSysOperLogs(in *pb.ListSysOperLogsRequest) (*pb.ListSysOperLogsResponse, error) {
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
	if len(strings.TrimSpace(in.OperName)) > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("oper_name LIKE '%%%s%%'", strings.TrimSpace(in.OperName)))
	}
	if len(strings.TrimSpace(in.Title)) > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("(title LIKE '%%%s%%' OR oper_url LIKE '%%%s%%')", strings.TrimSpace(in.Title), strings.TrimSpace(in.Title)))
	}
	if in.Status > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("status = %d", in.Status))
	}

	whereSql := ""
	if len(whereClauses) > 0 {
		whereSql = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	countSql := fmt.Sprintf("SELECT COUNT(*) FROM sys_oper_log %s", whereSql)
	var total int64
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countSql); err != nil {
		l.Errorf("Count sys_oper_log err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	querySql := fmt.Sprintf(`
		SELECT id, title, oper_name, oper_url, oper_method, oper_ip, status, error_msg, cost_time, create_time
		FROM sys_oper_log
		%s
		ORDER BY id DESC
		LIMIT %d, %d
	`, whereSql, offset, pageSize)

	type operLogRow struct {
		Id         int64  `db:"id"`
		Title      string `db:"title"`
		OperName   string `db:"oper_name"`
		OperUrl    string `db:"oper_url"`
		OperMethod string `db:"oper_method"`
		OperIp     string `db:"oper_ip"`
		Status     int32  `db:"status"`
		ErrorMsg   string `db:"error_msg"`
		CostTime   int64  `db:"cost_time"`
		CreateTime string `db:"create_time"`
	}

	var rows []operLogRow
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &rows, querySql); err != nil {
		l.Errorf("Query sys_oper_log rows err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	var list []*pb.SysOperLogItem
	for _, r := range rows {
		list = append(list, &pb.SysOperLogItem{
			Id:         r.Id,
			Title:      r.Title,
			OperName:   r.OperName,
			OperUrl:    r.OperUrl,
			OperMethod: r.OperMethod,
			OperIp:     r.OperIp,
			Status:     r.Status,
			ErrorMsg:   r.ErrorMsg,
			CostTime:   r.CostTime,
			CreateTime: r.CreateTime,
		})
	}

	return &pb.ListSysOperLogsResponse{
		Total: total,
		List:  list,
	}, nil
}
