package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListEnvsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListEnvsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListEnvsLogic {
	return &ListEnvsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListEnvsLogic) ListEnvs(in *titan.ListEnvsReq) (*titan.ListEnvsResp, error) {
	envs, err := l.svcCtx.EnvModel.ListByProject(l.ctx, in.ProjectId)
	if err != nil {
		return nil, xerr.NewErrMsg("查询环境列表失败: " + err.Error())
	}

	// 批量取集群名与绑定计数（消除 N+1）
	clusterIds := make([]int64, 0, len(envs))
	envIds := make([]int64, 0, len(envs))
	for _, e := range envs {
		clusterIds = append(clusterIds, e.ClusterId)
		envIds = append(envIds, e.Id)
	}
	clusters, err := l.svcCtx.ClusterModel.FindByIds(l.ctx, clusterIds)
	if err != nil {
		return nil, xerr.NewErrMsg("批量查询集群失败: " + err.Error())
	}
	bindingCounts, err := l.svcCtx.EnvAppBindingModel.CountByEnvIds(l.ctx, envIds)
	if err != nil {
		return nil, xerr.NewErrMsg("聚合环境应用计数失败: " + err.Error())
	}

	var list []*titan.EnvItem
	for _, e := range envs {
		var clusterName string
		if c, ok := clusters[e.ClusterId]; ok {
			clusterName = c.Name
		}
		var appCount int32
		if c, ok := bindingCounts[e.Id]; ok {
			appCount = int32(c)
		}
		list = append(list, &titan.EnvItem{
			Id:          e.Id,
			ProjectId:   e.ProjectId,
			EnvCode:     e.EnvCode,
			Name:        e.Name,
			ClusterId:   e.ClusterId,
			ClusterName: clusterName,
			Namespace:   e.Namespace,
			Status:      e.Status,
			AppCount:    appCount,
			CreateTime:  formatTime(e.CreateTime),
			UpdateTime:  formatTime(e.UpdateTime),
		})
	}

	return &titan.ListEnvsResp{
		List: list,
	}, nil
}
