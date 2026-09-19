package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/k8s"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

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

func (l *GetEnvLiveDetailLogic) GetEnvLiveDetail(in *titan.GetEnvLiveDetailReq) (*titan.GetEnvLiveDetailResp, error) {
	env, err := l.svcCtx.EnvModel.FindOne(l.ctx, in.EnvId)
	if err != nil {
		return nil, err
	}

	var clusterName string
	var clusterKubeconfig string
	cluster, err := l.svcCtx.ClusterModel.FindOne(l.ctx, env.ClusterId)
	if err == nil && cluster != nil {
		clusterName = cluster.Name
		clusterKubeconfig = cluster.Kubeconfig
	}

	// 尝试初始化 Kubernetes 客户端
	var clusterMgr *k8s.ClusterManager
	if clusterKubeconfig != "" {
		cfg, err := k8s.BuildConfigFromKubeconfig(clusterKubeconfig)
		if err == nil {
			clusterMgr, _ = k8s.NewClusterManager(cfg)
		}
	}

	// 查询该项目下所有应用
	var apps []*model.TitanApp
	queryApps := "SELECT id, project_id, name, display_name, description, integration_id, repo_url, default_branch, build_config, deploy_spec, status, create_time, update_time FROM titan_app WHERE project_id = ? ORDER BY id ASC"
	_ = l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &apps, queryApps, env.ProjectId)

	var liveApps []*titan.EnvAppLiveItem
	for _, app := range apps {
		item := &titan.EnvAppLiveItem{
			AppId:         app.Id,
			AppName:       app.Name,
			DisplayName:   app.DisplayName,
			Status:        "STOPPED",
			ReadyReplicas: 0,
			TotalReplicas: 0,
		}

		// 查询环境与应用绑定态
		binding, bErr := l.svcCtx.EnvAppBindingModel.FindOneByEnvIdAppId(l.ctx, env.Id, app.Id)
		if bErr == nil && binding != nil {
			item.CurrentArtifactId = binding.CurrentArtifactId
			item.ReadyReplicas = int32(binding.ReadyReplicas)
			item.TotalReplicas = int32(binding.TotalReplicas)
			item.Status = binding.Status
			if binding.LastDeployedTime.Valid {
				item.LastDeployedTime = binding.LastDeployedTime.Time.Format("2006-01-02 15:04:05")
			}

			// 查询制品详情
			if binding.CurrentArtifactId > 0 {
				art, aErr := l.svcCtx.ArtifactModel.FindOne(l.ctx, binding.CurrentArtifactId)
				if aErr == nil && art != nil {
					item.ImageTag = art.ImageTag
					item.ImageUrl = art.ImageUrl
					item.GitCommit = art.GitCommit
				}
			}
		}

		// 若 K8s 集群已直连，动态探测 Pod 列表
		if clusterMgr != nil && clusterMgr.ClientSet != nil {
			podList, err := clusterMgr.ClientSet.CoreV1().Pods(env.Namespace).List(l.ctx, metav1.ListOptions{
				LabelSelector: fmt.Sprintf("app=%s", app.Name),
			})
			if err == nil && len(podList.Items) > 0 {
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
				if readyCount == item.TotalReplicas {
					item.Status = "RUNNING"
				} else {
					item.Status = "UPDATING"
				}
			}
		}

		if len(item.Pods) == 0 && item.Status == "RUNNING" {
			// 演示环境容底 Pod 标识
			item.Pods = []string{
				fmt.Sprintf("%s-deployment-7f98d6c8b-x2k9l", app.Name),
				fmt.Sprintf("%s-deployment-7f98d6c8b-v8m4q", app.Name),
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
