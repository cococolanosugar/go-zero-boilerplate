package titanlogic

import (
	"context"
	"time"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetDeliveryMatrixLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetDeliveryMatrixLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetDeliveryMatrixLogic {
	return &GetDeliveryMatrixLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// 5. 交付大盘 (Matrix)
func (l *GetDeliveryMatrixLogic) GetDeliveryMatrix(in *titan.GetDeliveryMatrixReq) (*titan.GetDeliveryMatrixResp, error) {
	if in.ProjectId <= 0 {
		return nil, xerr.NewErrMsg("项目ID必须大于0")
	}

	// 1. 查询项目基本信息
	project, err := l.svcCtx.ProjectModel.FindOne(l.ctx, in.ProjectId)
	if err != nil {
		return nil, notFoundOrError(err, "项目")
	}

	// 2. 查询项目下所有环境（按 ID 升序）
	envs, err := l.svcCtx.EnvModel.ListByProject(l.ctx, in.ProjectId)
	if err != nil {
		return nil, xerr.NewErrMsg("查询环境列表失败: " + err.Error())
	}

	// 3. 查询集群信息
	var clusterIds []int64
	var envIds []int64
	for _, env := range envs {
		envIds = append(envIds, env.Id)
		if env.ClusterId > 0 {
			clusterIds = append(clusterIds, env.ClusterId)
		}
	}
	clustersMap, err := l.svcCtx.ClusterModel.FindByIds(l.ctx, clusterIds)
	if err != nil {
		return nil, xerr.NewErrMsg("查询集群信息失败: " + err.Error())
	}

	var envHeaders []*titan.MatrixEnvHeader
	for _, env := range envs {
		clusterName := ""
		if c, ok := clustersMap[env.ClusterId]; ok && c != nil {
			clusterName = c.Name
		}
		envHeaders = append(envHeaders, &titan.MatrixEnvHeader{
			EnvId:       env.Id,
			EnvCode:     env.EnvCode,
			EnvName:     env.Name,
			ClusterName: clusterName,
		})
	}

	// 4. 查询项目下所有应用 (微服务列表)
	apps, err := l.svcCtx.AppModel.ListLightByProject(l.ctx, in.ProjectId)
	if err != nil {
		return nil, xerr.NewErrMsg("查询微服务列表失败: " + err.Error())
	}

	if len(apps) == 0 || len(envs) == 0 {
		return &titan.GetDeliveryMatrixResp{
			ProjectId:   project.Id,
			ProjectName: project.Name,
			Envs:        envHeaders,
			Services:    []*titan.MatrixServiceRow{},
		}, nil
	}

	// 5. 批量查询环境中各应用绑定记录
	bindings, err := l.svcCtx.EnvAppBindingModel.ListByEnvIds(l.ctx, envIds)
	if err != nil {
		return nil, xerr.NewErrMsg("查询环境应用绑定失败: " + err.Error())
	}

	// 建立 (appId -> envId -> binding) 映射
	appEnvBindingMap := make(map[int64]map[int64]*model.TitanEnvAppBinding)
	var artifactIds []int64
	for _, b := range bindings {
		if _, ok := appEnvBindingMap[b.AppId]; !ok {
			appEnvBindingMap[b.AppId] = make(map[int64]*model.TitanEnvAppBinding)
		}
		appEnvBindingMap[b.AppId][b.EnvId] = b
		if b.CurrentArtifactId > 0 {
			artifactIds = append(artifactIds, b.CurrentArtifactId)
		}
	}

	// 6. 批量查询关联制品
	artifactsMap, err := l.svcCtx.ArtifactModel.FindByIds(l.ctx, artifactIds)
	if err != nil {
		return nil, xerr.NewErrMsg("查询制品信息失败: " + err.Error())
	}

	// 7. 组装矩阵行与单元格数据，计算跨环境版本差异 diffStatus
	var serviceRows []*titan.MatrixServiceRow
	for _, app := range apps {
		row := &titan.MatrixServiceRow{
			AppId:         app.Id,
			AppName:       app.Name,
			DisplayName:   app.DisplayName,
			RepoUrl:       app.RepoUrl,
			DefaultBranch: app.DefaultBranch,
			Cells:         make([]*titan.MatrixCellInfo, 0, len(envs)),
		}

		var prevEnvArtifact *model.TitanArtifact

		for _, env := range envs {
			cell := &titan.MatrixCellInfo{
				EnvId:        env.Id,
				EnvCode:      env.EnvCode,
				AppId:        app.Id,
				DeployStatus: "PENDING",
				HealthStatus: "UNKNOWN",
				DiffStatus:   "NOT_DEPLOYED",
			}

			if envMap, ok := appEnvBindingMap[app.Id]; ok {
				if b, hasBinding := envMap[env.Id]; hasBinding && b != nil {
					cell.DeployStatus = b.Status
					cell.ReadyReplicas = int32(b.ReadyReplicas)
					cell.TotalReplicas = int32(b.TotalReplicas)
					if b.LastDeployedTime.Valid {
						cell.LastDeployedAt = b.LastDeployedTime.Time.Format(time.RFC3339)
					}

					// 计算健康状态
					if b.Status == "RUNNING" {
						if b.TotalReplicas > 0 && b.ReadyReplicas >= b.TotalReplicas {
							cell.HealthStatus = "HEALTHY"
						} else {
							cell.HealthStatus = "DEGRADED"
						}
					} else if b.Status == "FAILED" {
						cell.HealthStatus = "UNHEALTHY"
					} else {
						cell.HealthStatus = "UNKNOWN"
					}

					// 获取当前运行制品
					var curArtifact *model.TitanArtifact
					if b.CurrentArtifactId > 0 {
						if art, hasArt := artifactsMap[b.CurrentArtifactId]; hasArt && art != nil {
							curArtifact = art
							cell.ArtifactId = art.Id
							cell.VersionTag = art.ImageTag
							cell.GitCommit = art.GitCommit
							cell.GitBranch = art.GitBranch
						}
					}

					// 计算版本差异状态
					if curArtifact == nil {
						cell.DiffStatus = "NOT_DEPLOYED"
					} else if prevEnvArtifact == nil {
						cell.DiffStatus = "IN_SYNC"
					} else {
						if curArtifact.ImageTag == prevEnvArtifact.ImageTag && curArtifact.GitCommit == prevEnvArtifact.GitCommit {
							cell.DiffStatus = "IN_SYNC"
						} else {
							cell.DiffStatus = "BEHIND"
						}
					}

					if curArtifact != nil {
						prevEnvArtifact = curArtifact
					}
				}
			}

			row.Cells = append(row.Cells, cell)
		}

		serviceRows = append(serviceRows, row)
	}

	return &titan.GetDeliveryMatrixResp{
		ProjectId:   project.Id,
		ProjectName: project.Name,
		Envs:        envHeaders,
		Services:    serviceRows,
	}, nil
}
