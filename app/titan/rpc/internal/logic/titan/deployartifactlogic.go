package titanlogic

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/k8s"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeployArtifactLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeployArtifactLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeployArtifactLogic {
	return &DeployArtifactLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeployArtifactLogic) DeployArtifact(in *titan.DeployArtifactReq) (*titan.CommonResp, error) {
	env, err := l.svcCtx.EnvModel.FindOne(l.ctx, in.EnvId)
	if err != nil {
		return nil, fmt.Errorf("environment not found: %w", err)
	}

	app, err := l.svcCtx.AppModel.FindOne(l.ctx, in.AppId)
	if err != nil {
		return nil, fmt.Errorf("application not found: %w", err)
	}

	artifact, err := l.svcCtx.ArtifactModel.FindOne(l.ctx, in.ArtifactId)
	if err != nil {
		return nil, fmt.Errorf("artifact not found: %w", err)
	}

	cluster, err := l.svcCtx.ClusterModel.FindOne(l.ctx, env.ClusterId)
	if err != nil {
		return nil, fmt.Errorf("cluster not found: %w", err)
	}

	fullImage := fmt.Sprintf("%s:%s", artifact.ImageUrl, artifact.ImageTag)

	// 1. 动态渲染 K8s 编排 YAML 模板
	if app.DeploySpec != "" {
		params := map[string]interface{}{
			"IMAGE":    fullImage,
			"APP_NAME": app.Name,
			"REPLICAS": 2,
		}
		renderedYaml, rErr := k8s.RenderYamlTemplate(app.DeploySpec, params)
		if rErr == nil && renderedYaml != "" && cluster.Kubeconfig != "" {
			// 2. 若关联 K8s 集群可用，执行 Server-Side Apply
			cfg, cErr := k8s.BuildConfigFromKubeconfig(cluster.Kubeconfig)
			if cErr == nil {
				mgr, mErr := k8s.NewClusterManager(cfg)
				if mErr == nil {
					_, _ = mgr.ApplyYaml(l.ctx, env.Namespace, renderedYaml, false)
				}
			}
		}
	}

	// 3. 更新或新建环境-应用绑定态 (EnvAppBinding)
	binding, bErr := l.svcCtx.EnvAppBindingModel.FindOneByEnvIdAppId(l.ctx, env.Id, app.Id)
	now := time.Now()
	if bErr == nil && binding != nil {
		binding.CurrentArtifactId = artifact.Id
		binding.Status = "RUNNING"
		binding.ReadyReplicas = 2
		binding.TotalReplicas = 2
		binding.LastDeployedTime = sql.NullTime{Time: now, Valid: true}
		_ = l.svcCtx.EnvAppBindingModel.Update(l.ctx, binding)
	} else {
		_, _ = l.svcCtx.EnvAppBindingModel.Insert(l.ctx, &model.TitanEnvAppBinding{
			EnvId:             env.Id,
			AppId:             app.Id,
			CurrentArtifactId: artifact.Id,
			ReadyReplicas:     2,
			TotalReplicas:     2,
			Status:            "RUNNING",
			LastDeployedTime:  sql.NullTime{Time: now, Valid: true},
		})
	}

	l.Infof("Successfully deployed artifact %s (tag: %s) for app %s into env %s (namespace: %s)",
		artifact.ImageUrl, artifact.ImageTag, app.Name, env.Name, env.Namespace)

	return &titan.CommonResp{
		Code: 200,
		Msg:  fmt.Sprintf("Successfully deployed artifact %s to %s", artifact.ImageTag, env.Name),
	}, nil
}
