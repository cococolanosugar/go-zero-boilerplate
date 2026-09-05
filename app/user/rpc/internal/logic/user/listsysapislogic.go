package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysApisLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysApisLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysApisLogic {
	return &ListSysApisLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSysApisLogic) ListSysApis(in *pb.EmptyRequest) (*pb.ListSysApisResponse, error) {
	querySql := "SELECT id, api_group, title, path, method, is_auto_sync FROM sys_api ORDER BY api_group ASC, id ASC"
	type apiRow struct {
		Id         int64  `db:"id"`
		ApiGroup   string `db:"api_group"`
		Title      string `db:"title"`
		Path       string `db:"path"`
		Method     string `db:"method"`
		IsAutoSync int32  `db:"is_auto_sync"`
	}

	var rows []apiRow
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &rows, querySql); err != nil {
		l.Errorf("Query sys_api rows err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	var list []*pb.SysApiItem
	for _, r := range rows {
		list = append(list, &pb.SysApiItem{
			Id:         r.Id,
			ApiGroup:   r.ApiGroup,
			Title:      r.Title,
			Path:       r.Path,
			Method:     r.Method,
			IsAutoSync: r.IsAutoSync,
		})
	}

	return &pb.ListSysApisResponse{
		List: list,
	}, nil
}

