package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

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
	offset, limit := normalizePage(int64(in.Page), int64(in.PageSize))
	keyword := escapeLike(in.Keyword)

	projects, total, err := l.svcCtx.ProjectModel.ListByPage(l.ctx, keyword, offset, limit)
	if err != nil {
		return nil, xerr.NewErrMsg("查询项目列表失败: " + err.Error())
	}

	// 一次聚合查询回填应用/环境计数（消除 N+1）
	counts, err := l.svcCtx.ProjectModel.CountAppsAndEnvsByProject(l.ctx, projectIdsOf(projects))
	if err != nil {
		return nil, xerr.NewErrMsg("聚合项目资源计数失败: " + err.Error())
	}

	var list []*titan.ProjectItem
	for _, p := range projects {
		appCount, envCount := int32(0), int32(0)
		if c, ok := counts[p.Id]; ok {
			appCount = int32(c.AppCount)
			envCount = int32(c.EnvCount)
		}
		list = append(list, &titan.ProjectItem{
			Id:          p.Id,
			Name:        p.Name,
			DisplayName: p.DisplayName,
			Description: p.Description,
			OwnerId:     p.OwnerId,
			Status:      int32(p.Status),
			AppCount:    appCount,
			EnvCount:    envCount,
			CreateTime:  formatTime(p.CreateTime),
			UpdateTime:  formatTime(p.UpdateTime),
		})
	}

	return &titan.ListProjectsResp{
		Total: total,
		List:  list,
	}, nil
}

func projectIdsOf(projects []*model.TitanProject) []int64 {
	ids := make([]int64, 0, len(projects))
	for _, p := range projects {
		ids = append(ids, p.Id)
	}
	return ids
}
