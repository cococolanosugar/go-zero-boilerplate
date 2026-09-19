package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/k8s"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetEnvLiveDetailLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetEnvLiveDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetEnvLiveDetailLogic {
	return &GetEnvLiveDetailLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// GetEnvLiveDetail 环境实时大盘：绑定/制品批量查询（消除 N+1），Pod 与副本数来自真实集群回读，
// 状态只反映 DB 绑定状态与真实 Pod 探测结果，不虚构 Pod 与副本数。
func (l *GetEnvLiveDetailLogic) GetEnvLiveDetail(in *titan.GetEnvLiveDetailReq) (*titan.GetEnvLiveDetailResp, error) {
	env, err := l.svcCtx.EnvModel.FindOne(l.ctx, in.EnvId)
	if err != nil {
		return nil, notFoundOrError(err, "环境")
	}

	var clusterName string
	var clusterKubeconfig string
	cluster, err := l.svcCtx.ClusterModel.FindOne(l.ctx, env.ClusterId)
	if err != nil {
		return nil, notFoundOrError(err, "集群")
	}
	clusterName = cluster.Name
	clusterKubeconfig = cluster.Kubeconfig

	// 尝试初始化 Kubernetes 客户端（失败记录日志，大盘降级为仅展示 DB 绑定状态）
	var clusterMgr *k8s.ClusterManager
	if clusterKubeconfig != "" {
		cfg, cErr := k8s.BuildConfigFromKubeconfig(clusterKubeconfig)
		if cErr != nil {
			l.Errorf("解析集群配置失败 clusterId=%d: %v", env.ClusterId, cErr)
		} else if mgr, mErr := k8s.NewClusterManager(cfg); mErr != nil {
			l.Errorf("初始化集群客户端失败 clusterId=%d: %v", env.ClusterId, mErr)
		} else {
			clusterMgr = mgr
		}
	}

	// 项目下应用（轻量列）
	apps, err := l.svcCtx.AppModel.ListLightByProject(l.ctx, env.ProjectId)
	if err != nil {
		return nil, xerr.NewErrMsg("查询项目应用列表失败: " + err.Error())
	}

	// 环境绑定与制品批量查询（消除 N+1）
	bindings, err := l.svcCtx.EnvAppBindingModel.ListByEnvId(l.ctx, env.Id)
	if err != nil {
		return nil, xerr.NewErrMsg("查询环境绑定失败: " + err.Error())
	}
	bindingByApp := make(map[int64]*model.TitanEnvAppBinding, len(bindings))
	artifactIds := make([]int64, 0, len(bindings))
	for _, b := range bindings {
		bindingByApp[b.AppId] = b
		if b.CurrentArtifactId > 0 {
			artifactIds = append(artifactIds, b.CurrentArtifactId)
		}
	}
	artifacts, err := l.svcCtx.ArtifactModel.FindByIds(l.ctx, artifactIds)
	if err != nil {
		return nil, xerr.NewErrMsg("批量查询制品失败: " + err.Error())
	}

	var liveApps []*titan.EnvAppLiveItem
	for _, app := range apps {
		item := &titan.EnvAppLiveItem{
			AppId:         app.Id,
			AppName:       app.Name,
			DisplayName:   app.DisplayName,
			Status:        model.BindingStatusStopped,
			ReadyReplicas: 0,
			TotalReplicas: 0,
		}

		if binding, ok := bindingByApp[app.Id]; ok {
			item.CurrentArtifactId = binding.CurrentArtifactId
			item.ReadyReplicas = int32(binding.ReadyReplicas)
			item.TotalReplicas = int32(binding.TotalReplicas)
			item.Status = binding.Status
			item.LastDeployedTime = formatNullTime(binding.LastDeployedTime)

			if art, ok := artifacts[binding.CurrentArtifactId]; ok {
				item.ImageTag = art.ImageTag
				item.ImageUrl = art.ImageUrl
				item.GitCommit = art.GitCommit
			}
		}

		// 若 K8s 集群已直连，动态探测 Pod 列表（真实回读，不虚构）
		if clusterMgr != nil && clusterMgr.ClientSet != nil {
			podList, pErr := clusterMgr.ClientSet.CoreV1().Pods(env.Namespace).List(l.ctx, metav1.ListOptions{
				LabelSelector: fmt.Sprintf("app=%s", app.Name),
			})
			if pErr == nil && len(podList.Items) > 0 {
				var podNames []string
				var readyCount int32
				for _, p := range podList.Items {
					podNames = append(podNames, p.Name)
					if p.Status.Phase == "Running" {
						readyCount++
					}
				}
				item.Pods = podNames
				item.ReadyReplicas = readyCount
				item.TotalReplicas = int32(len(podList.Items))
				// 全部就绪且绑定状态为部署中/待部署时推进为 RUNNING（真实探测结果）
				if readyCount == item.TotalReplicas && item.Status != model.BindingStatusFailed {
					item.Status = model.BindingStatusRunning
				}
			}
		}

		liveApps = append(liveApps, item)
	}

	return &titan.GetEnvLiveDetailResp{
		EnvId:       env.Id,
		EnvCode:     env.EnvCode,
		EnvName:     env.Name,
		ClusterName: clusterName,
		Namespace:   env.Namespace,
		Apps:        liveApps,
	}, nil
}
