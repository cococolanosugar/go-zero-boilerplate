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

type ListSysDictDataLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysDictDataLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysDictDataLogic {
	return &ListSysDictDataLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSysDictDataLogic) ListSysDictData(in *pb.ListSysDictDataRequest) (*pb.ListSysDictDataResponse, error) {
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
	if len(strings.TrimSpace(in.DictType)) > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("dict_type = '%s'", strings.TrimSpace(in.DictType)))
	}
	if len(strings.TrimSpace(in.Keyword)) > 0 {
		kw := strings.TrimSpace(in.Keyword)
		whereClauses = append(whereClauses, fmt.Sprintf("(dict_label LIKE '%%%s%%' OR dict_value LIKE '%%%s%%')", kw, kw))
	}
	if in.Status > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("status = %d", in.Status))
	}

	whereSql := ""
	if len(whereClauses) > 0 {
		whereSql = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	countSql := fmt.Sprintf("SELECT COUNT(*) FROM sys_dict_data %s", whereSql)
	var total int64
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countSql); err != nil {
		l.Errorf("Count sys_dict_data err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	querySql := fmt.Sprintf(`
		SELECT id, dict_type, dict_label, dict_value, dict_sort, list_class, is_default, status, remark, create_time
		FROM sys_dict_data
		%s
		ORDER BY dict_sort ASC, id ASC
		LIMIT %d, %d
	`, whereSql, offset, pageSize)

	type dictDataRow struct {
		Id         int64  `db:"id"`
		DictType   string `db:"dict_type"`
		DictLabel  string `db:"dict_label"`
		DictValue  string `db:"dict_value"`
		DictSort   int32  `db:"dict_sort"`
		ListClass  string `db:"list_class"`
		IsDefault  int32  `db:"is_default"`
		Status     int32  `db:"status"`
		Remark     string `db:"remark"`
		CreateTime string `db:"create_time"`
	}

	var rows []dictDataRow
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &rows, querySql); err != nil {
		l.Errorf("Query sys_dict_data rows err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	var list []*pb.SysDictDataItem
	for _, r := range rows {
		list = append(list, &pb.SysDictDataItem{
			Id:         r.Id,
			DictType:   r.DictType,
			DictLabel:  r.DictLabel,
			DictValue:  r.DictValue,
			DictSort:   r.DictSort,
			ListClass:  r.ListClass,
			IsDefault:  r.IsDefault,
			Status:     r.Status,
			Remark:     r.Remark,
			CreateTime: r.CreateTime,
		})
	}

	return &pb.ListSysDictDataResponse{
		Total: total,
		List:  list,
	}, nil
}
