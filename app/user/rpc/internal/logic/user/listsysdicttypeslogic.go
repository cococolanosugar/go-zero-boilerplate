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

type ListSysDictTypesLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysDictTypesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysDictTypesLogic {
	return &ListSysDictTypesLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSysDictTypesLogic) ListSysDictTypes(in *pb.ListSysDictTypesRequest) (*pb.ListSysDictTypesResponse, error) {
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
	if len(strings.TrimSpace(in.Keyword)) > 0 {
		kw := strings.TrimSpace(in.Keyword)
		whereClauses = append(whereClauses, fmt.Sprintf("(dict_name LIKE '%%%s%%' OR dict_type LIKE '%%%s%%')", kw, kw))
	}
	if in.Status > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("status = %d", in.Status))
	}

	whereSql := ""
	if len(whereClauses) > 0 {
		whereSql = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	countSql := fmt.Sprintf("SELECT COUNT(*) FROM sys_dict_type %s", whereSql)
	var total int64
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countSql); err != nil {
		l.Errorf("Count sys_dict_type err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	querySql := fmt.Sprintf(`
		SELECT id, dict_name, dict_type, status, remark, create_time
		FROM sys_dict_type
		%s
		ORDER BY id DESC
		LIMIT %d, %d
	`, whereSql, offset, pageSize)

	type dictTypeRow struct {
		Id         int64  `db:"id"`
		DictName   string `db:"dict_name"`
		DictType   string `db:"dict_type"`
		Status     int32  `db:"status"`
		Remark     string `db:"remark"`
		CreateTime string `db:"create_time"`
	}

	var rows []dictTypeRow
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &rows, querySql); err != nil {
		l.Errorf("Query sys_dict_type rows err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	var list []*pb.SysDictTypeItem
	for _, r := range rows {
		list = append(list, &pb.SysDictTypeItem{
			Id:         r.Id,
			DictName:   r.DictName,
			DictType:   r.DictType,
			Status:     r.Status,
			Remark:     r.Remark,
			CreateTime: r.CreateTime,
		})
	}

	return &pb.ListSysDictTypesResponse{
		Total: total,
		List:  list,
	}, nil
}
