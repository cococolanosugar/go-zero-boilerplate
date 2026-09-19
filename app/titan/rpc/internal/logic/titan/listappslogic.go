package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListAppsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListAppsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListAppsLogic {
	return &ListAppsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListAppsLogic) ListApps(in *titan.ListAppsReq) (*titan.ListAppsResp, error) {
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
	if in.ProjectId > 0 {
		where += " AND project_id = ?"
		args = append(args, in.ProjectId)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM titan_app %s", where)
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countQuery, args...); err != nil {
		return nil, err
	}

	var apps []*model.TitanApp
	listQuery := fmt.Sprintf("SELECT id, project_id, name, display_name, description, integration_id, repo_url, default_branch, build_config, deploy_spec, status, create_time, update_time FROM titan_app %s ORDER BY id DESC LIMIT %d, %d", where, offset, pageSize)
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &apps, listQuery, args...); err != nil {
		return nil, err
	}

	var list []*titan.AppItem
	for _, a := range apps {
		list = append(list, &titan.AppItem{
			Id:            a.Id,
			ProjectId:     a.ProjectId,
			Name:          a.Name,
			DisplayName:   a.DisplayName,
			Description:   a.Description,
			IntegrationId: a.IntegrationId,
			RepoUrl:       a.RepoUrl,
			DefaultBranch: a.DefaultBranch,
			BuildConfig:   a.BuildConfig,
			DeploySpec:    a.DeploySpec,
			Status:        int32(a.Status),
			CreateTime:    a.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:    a.UpdateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &titan.ListAppsResp{
		Total: total,
		List:  list,
	}, nil
}
