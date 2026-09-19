package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

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

// ListApps 列表返回轻量列（不含 deploy_spec / build_config 大字段，详情接口 GetApp 单独取）
func (l *ListAppsLogic) ListApps(in *titan.ListAppsReq) (*titan.ListAppsResp, error) {
	offset, limit := normalizePage(int64(in.Page), int64(in.PageSize))

	apps, total, err := l.svcCtx.AppModel.ListLightByPage(l.ctx, in.ProjectId, offset, limit)
	if err != nil {
		return nil, xerr.NewErrMsg("查询应用列表失败: " + err.Error())
	}

	var list []*titan.AppItem
	for _, a := range apps {
		// 轻量结构不含 buildConfig/deploySpec 大字段：列表响应留空，详情接口单独取
		list = append(list, &titan.AppItem{
			Id:            a.Id,
			ProjectId:     a.ProjectId,
			Name:          a.Name,
			DisplayName:   a.DisplayName,
			Description:   a.Description,
			IntegrationId: a.IntegrationId,
			RepoUrl:       a.RepoUrl,
			DefaultBranch: a.DefaultBranch,
			BuildConfig:   "",
			DeploySpec:    "",
			Status:        int32(a.Status),
			CreateTime:    formatTime(a.CreateTime),
			UpdateTime:    formatTime(a.UpdateTime),
		})
	}

	return &titan.ListAppsResp{
		Total: total,
		List:  list,
	}, nil
}
