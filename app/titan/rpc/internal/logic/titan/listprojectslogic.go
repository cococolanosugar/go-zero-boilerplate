package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListProjectsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListProjectsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListProjectsLogic {
	return &ListProjectsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListProjectsLogic) ListProjects(in *titan.ListProjectsReq) (*titan.ListProjectsResp, error) {
	page := in.Page
	if page <= 0 {
		page = 1
	}
	pageSize := in.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	where := "WHERE 1=1"
	var args []interface{}
	if in.Keyword != "" {
		where += " AND (name LIKE ? OR display_name LIKE ?)"
		kw := "%" + in.Keyword + "%"
		args = append(args, kw, kw)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM titan_project %s", where)
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countQuery, args...); err != nil {
		return nil, err
	}

	var projects []*model.TitanProject
	listQuery := fmt.Sprintf("SELECT id, name, display_name, description, owner_id, status, create_time, update_time FROM titan_project %s ORDER BY id DESC LIMIT %d, %d", where, offset, pageSize)
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &projects, listQuery, args...); err != nil {
		return nil, err
	}

	var list []*titan.ProjectItem
	for _, p := range projects {
		var appCount int32
		_ = l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &appCount, "SELECT COUNT(*) FROM titan_app WHERE project_id = ?", p.Id)

		var envCount int32
		_ = l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &envCount, "SELECT COUNT(*) FROM titan_env WHERE project_id = ?", p.Id)

		list = append(list, &titan.ProjectItem{
			Id:          p.Id,
			Name:        p.Name,
			DisplayName: p.DisplayName,
			Description: p.Description,
			OwnerId:     p.OwnerId,
			Status:      int32(p.Status),
			AppCount:    appCount,
			EnvCount:    envCount,
			CreateTime:  p.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:  p.UpdateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &titan.ListProjectsResp{
		Total: total,
		List:  list,
	}, nil
}
