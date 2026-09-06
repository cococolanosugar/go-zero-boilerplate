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

type GetDictDataByTypeLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetDictDataByTypeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetDictDataByTypeLogic {
	return &GetDictDataByTypeLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetDictDataByTypeLogic) GetDictDataByType(in *pb.GetDictDataByTypeRequest) (*pb.GetDictDataByTypeResponse, error) {
	dictType := strings.TrimSpace(in.DictType)
	if len(dictType) == 0 {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "字典类型不能为空")
	}

	querySql := fmt.Sprintf(`
		SELECT id, dict_type, dict_label, dict_value, dict_sort, list_class, is_default, status, remark, create_time
		FROM sys_dict_data
		WHERE dict_type = '%s' AND status = 1
		ORDER BY dict_sort ASC, id ASC
	`, dictType)

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
		l.Errorf("Query sys_dict_data by type err: %v", err)
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

	return &pb.GetDictDataByTypeResponse{
		List: list,
	}, nil
}
