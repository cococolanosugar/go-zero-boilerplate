package titanlogic

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/k8s"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

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

// clusterApplyFn 集群下发与副本回读的可注入测试缝：
// 解析集群配置 → 建立连接 → Apply → 回读副本数，任一失败以业务错误返回。
// 回读副本数失败时降级为 0（不虚构），不阻断部署成功。
var clusterApplyFn = func(ctx context.Context, kubeconfig, namespace, appName, renderedYaml string) (ready, total int32, err error) {
	cfg, cErr := k8s.BuildConfigFromKubeconfig(kubeconfig)
	if cErr != nil {
		return 0, 0, xerr.NewErrMsg("解析集群配置失败: " + cErr.Error())
	}
	mgr, mErr := k8s.NewClusterManager(cfg)
	if mErr != nil {
		return 0, 0, xerr.NewErrMsg("连接集群失败: " + mErr.Error())
	}
	if _, aErr := mgr.ApplyYaml(ctx, namespace, renderedYaml, false); aErr != nil {
		return 0, 0, xerr.NewErrMsg("集群下发失败: " + aErr.Error())
	}
	r, t, rErr := mgr.GetDeploymentReplicas(ctx, namespace, appName)
	if rErr != nil {
		logx.WithContext(ctx).Errorf("部署后回读副本数失败 app=%s ns=%s: %v", appName, namespace, rErr)
		rErr = nil
	}
	return r, t, rErr
}

// DeployArtifact 制品部署：归属校验链 → 部署幂等锁 → 集群下发 → 状态真实回读 → 终态落库。
// 任何一步失败都向调用方返回错误并保证绑定记录不残留 DEPLOYING / 假 RUNNING 状态。
func (l *DeployArtifactLogic) DeployArtifact(in *titan.DeployArtifactReq) (*titan.CommonResp, error) {
	// ---- 1. 归属校验链：制品 → 应用 → 环境 → 项目，任一不匹配即拒绝（不泄露资源存在性） ----
	env, err := l.svcCtx.EnvModel.FindOne(l.ctx, in.EnvId)
	if err != nil {
		return nil, notFoundOrError(err, "环境")
	}
	if in.ProjectId > 0 && env.ProjectId != in.ProjectId {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	app, err := l.svcCtx.AppModel.FindOne(l.ctx, in.AppId)
	if err != nil {
		return nil, notFoundOrError(err, "应用")
	}
	if app.ProjectId != env.ProjectId {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}
	if app.Status != model.CommonStatusEnabled {
		return nil, xerr.NewErrMsg("应用已停用，无法部署")
	}

	artifact, err := l.svcCtx.ArtifactModel.FindOne(l.ctx, in.ArtifactId)
	if err != nil {
		return nil, notFoundOrError(err, "制品")
	}
	if artifact.AppId != app.Id {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}
	if artifact.Status != model.ArtifactStatusAvailable {
		return nil, xerr.NewErrMsg("制品当前不可用（状态: " + artifact.Status + "），无法部署")
	}

	cluster, err := l.svcCtx.ClusterModel.FindOne(l.ctx, env.ClusterId)
	if err != nil {
		return nil, notFoundOrError(err, "集群")
	}

	// ---- 2. 部署幂等锁：绑定置为 DEPLOYING，抢锁失败拒绝重复部署 ----
	binding, bErr := l.svcCtx.EnvAppBindingModel.FindOneByEnvIdAppId(l.ctx, env.Id, app.Id)
	var lockedBinding *model.TitanEnvAppBinding
	if bErr == nil && binding != nil {
		locked, lErr := l.svcCtx.EnvAppBindingModel.LockForDeploy(l.ctx, env.Id, app.Id)
		if lErr != nil {
			return nil, xerr.NewErrMsg("获取部署锁失败: " + lErr.Error())
		}
		if !locked {
			return nil, xerr.NewErrMsg("该应用在此环境已有部署进行中，请稍后再试")
		}
		lockedBinding = binding
	} else if bErr != nil {
		if bErr != model.ErrNotFound {
			return nil, xerr.NewErrMsg("查询部署绑定失败: " + bErr.Error())
		}
		// 首次部署：插入 DEPLOYING 绑定记录；并发插入撞唯一键视为已有部署进行中
		inserted, iErr := l.svcCtx.EnvAppBindingModel.Insert(l.ctx, &model.TitanEnvAppBinding{
			EnvId:             env.Id,
			AppId:             app.Id,
			Status:            model.BindingStatusDeploying,
			CurrentArtifactId: artifact.Id,
		})
		if iErr != nil {
			if strings.Contains(iErr.Error(), "Duplicate entry") || strings.Contains(iErr.Error(), "1062") {
				return nil, xerr.NewErrMsg("该应用在此环境已有部署进行中，请稍后再试")
			}
			return nil, xerr.NewErrMsg("创建部署绑定失败: " + iErr.Error())
		}
		newId, idErr := inserted.LastInsertId()
		if idErr != nil {
			return nil, xerr.NewErrMsg("获取部署绑定ID失败: " + idErr.Error())
		}
		lockedBinding = &model.TitanEnvAppBinding{
			Id:                newId,
			EnvId:             env.Id,
			AppId:             app.Id,
			Status:            model.BindingStatusDeploying,
			CurrentArtifactId: artifact.Id,
		}
	}

	// failUnlocked 任何失败路径必须解锁为 FAILED，不留 DEPLOYING 悬挂态
	failUnlocked := func(reason error) (*titan.CommonResp, error) {
		if lockedBinding != nil {
			if fErr := l.svcCtx.EnvAppBindingModel.FinishDeploy(l.ctx, lockedBinding, model.BindingStatusFailed); fErr != nil {
				l.Errorf("部署失败且解锁失败 bindingId=%d: %v (原失败原因: %v)", lockedBinding.Id, fErr, reason)
			}
		}
		return nil, reason
	}

	// ---- 3. 输入校验：镜像引用格式 ----
	fullImage := fmt.Sprintf("%s:%s", artifact.ImageUrl, artifact.ImageTag)
	if imgErr := validateImageRef(fullImage); imgErr != nil {
		return failUnlocked(xerr.NewErrMsg("部署被拒绝: " + imgErr.Error()))
	}

	// ---- 4. 渲染部署模板并校验资源白名单，任一步失败全量上抛 ----
	now := time.Now()
	if app.DeploySpec != "" {
		params := map[string]interface{}{
			"IMAGE":    fullImage,
			"APP_NAME": app.Name,
			"REPLICAS": 2,
		}
		renderedYaml, rErr := k8s.RenderYamlTemplate(app.DeploySpec, params)
		if rErr != nil {
			return failUnlocked(xerr.NewErrMsg("渲染部署模板失败: " + rErr.Error()))
		}
		if vErr := k8s.ValidateRenderedManifest(renderedYaml, env.Namespace); vErr != nil {
			return failUnlocked(xerr.NewErrMsg("部署模板校验失败: " + vErr.Error()))
		}

		ready, total, aErr := clusterApplyFn(l.ctx, cluster.Kubeconfig, env.Namespace, app.Name, renderedYaml)
		if aErr != nil {
			return failUnlocked(aErr)
		}

		// ---- 6. 成功终态落库：绑定状态置 RUNNING，写库失败同样返回错误 ----
		lockedBinding.CurrentArtifactId = artifact.Id
		lockedBinding.Status = model.BindingStatusRunning
		lockedBinding.ReadyReplicas = int64(ready)
		lockedBinding.TotalReplicas = int64(total)
		lockedBinding.LastDeployedTime = sql.NullTime{Time: now, Valid: true}
		if uErr := l.svcCtx.EnvAppBindingModel.Update(l.ctx, lockedBinding); uErr != nil {
			return nil, xerr.NewErrMsg("部署已下发但绑定记录更新失败: " + uErr.Error())
		}
	} else {
		// 无部署模板：仅登记制品绑定（登记失败同样上抛，不留假成功）
		lockedBinding.CurrentArtifactId = artifact.Id
		lockedBinding.Status = model.BindingStatusStopped
		lockedBinding.LastDeployedTime = sql.NullTime{Time: now, Valid: true}
		if uErr := l.svcCtx.EnvAppBindingModel.Update(l.ctx, lockedBinding); uErr != nil {
			return nil, xerr.NewErrMsg("更新绑定记录失败: " + uErr.Error())
		}
		l.Infof("artifact %s bound to app %s in env %s (no deploySpec, skip cluster apply)",
			artifact.ImageTag, app.Name, env.Name)
	}

	l.Infof("operator %d deployed artifact %s (tag %s) for app %s into env %s (ns %s)",
		in.OperatorId, artifact.ImageUrl, artifact.ImageTag, app.Name, env.Name, env.Namespace)

	return &titan.CommonResp{
		Code: 200,
		Msg:  fmt.Sprintf("Successfully deployed artifact %s to %s", artifact.ImageTag, env.Name),
	}, nil
}
