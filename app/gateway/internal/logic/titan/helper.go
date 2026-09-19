package titan

import (
	"context"
	"encoding/json"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/types"
)

func getUserIdFromCtx(ctx context.Context) int64 {
	var userId int64
	if uidVal := ctx.Value("userId"); uidVal != nil {
		if uidNum, ok := uidVal.(json.Number); ok {
			if uidInt, err := uidNum.Int64(); err == nil {
				userId = uidInt
			}
		} else if uidInt, ok := uidVal.(int64); ok {
			userId = uidInt
		}
	}
	return userId
}

func toIntegrationVO(item *titan.IntegrationItem) types.IntegrationVO {
	if item == nil {
		return types.IntegrationVO{}
	}
	return types.IntegrationVO{
		Id:          item.Id,
		Name:        item.Name,
		Category:    item.Category,
		AuthType:    item.AuthType,
		Config:      item.Config,
		Status:      item.Status,
		Description: item.Description,
		CreatedBy:   item.CreatedBy,
		CreateTime:  item.CreateTime,
		UpdateTime:  item.UpdateTime,
	}
}

func toClusterVO(item *titan.ClusterItem) types.ClusterVO {
	if item == nil {
		return types.ClusterVO{}
	}
	return types.ClusterVO{
		Id:          item.Id,
		Name:        item.Name,
		Env:         item.Env,
		ApiEndpoint: item.ApiEndpoint,
		Status:      item.Status,
		Version:     item.Version,
		Description: item.Description,
		CreatedBy:   item.CreatedBy,
		CreateTime:  item.CreateTime,
		UpdateTime:  item.UpdateTime,
	}
}

func toPipelineVO(item *titan.PipelineItem) types.PipelineVO {
	if item == nil {
		return types.PipelineVO{}
	}
	return types.PipelineVO{
		Id:          item.Id,
		Name:        item.Name,
		DisplayName: item.DisplayName,
		Category:    item.Category,
		GitRepo:     item.GitRepo,
		GitBranch:   item.GitBranch,
		Stages:      item.Stages,
		Params:      item.Params,
		Triggers:    item.Triggers,
		Status:      item.Status,
		Description: item.Description,
		CreatedBy:   item.CreatedBy,
		CreateTime:  item.CreateTime,
		UpdateTime:  item.UpdateTime,
	}
}

func toExecutionVO(item *titan.ExecutionItem) types.ExecutionVO {
	if item == nil {
		return types.ExecutionVO{}
	}
	return types.ExecutionVO{
		Id:            item.Id,
		PipelineId:    item.PipelineId,
		PipelineName:  item.PipelineName,
		ExecNo:        item.ExecNo,
		TriggerType:   item.TriggerType,
		TriggerBy:     item.TriggerBy,
		GitBranch:     item.GitBranch,
		GitCommit:     item.GitCommit,
		RuntimeParams: item.RuntimeParams,
		Status:        item.Status,
		WorkflowId:    item.WorkflowId,
		StartTime:     item.StartTime,
		EndTime:       item.EndTime,
		DurationMs:    item.DurationMs,
		Artifacts:     item.Artifacts,
		CreateTime:    item.CreateTime,
	}
}

func toStepExecVO(item *titan.StepExecItem) types.StepExecVO {
	if item == nil {
		return types.StepExecVO{}
	}
	return types.StepExecVO{
		Id:         item.Id,
		ExecId:     item.ExecId,
		StageId:    item.StageId,
		StepId:     item.StepId,
		StepName:   item.StepName,
		StepType:   item.StepType,
		Status:     item.Status,
		LogPath:    item.LogPath,
		ErrorMsg:   item.ErrorMsg,
		StartTime:  item.StartTime,
		EndTime:    item.EndTime,
		DurationMs: item.DurationMs,
	}
}

func toProjectVO(item *titan.ProjectItem) types.ProjectVO {
	if item == nil {
		return types.ProjectVO{}
	}
	return types.ProjectVO{
		Id:          item.Id,
		Name:        item.Name,
		DisplayName: item.DisplayName,
		Description: item.Description,
		OwnerId:     item.OwnerId,
		Status:      item.Status,
		AppCount:    item.AppCount,
		EnvCount:    item.EnvCount,
		CreateTime:  item.CreateTime,
		UpdateTime:  item.UpdateTime,
	}
}

func toAppVO(item *titan.AppItem) types.AppVO {
	if item == nil {
		return types.AppVO{}
	}
	return types.AppVO{
		Id:            item.Id,
		ProjectId:     item.ProjectId,
		Name:          item.Name,
		DisplayName:   item.DisplayName,
		Description:   item.Description,
		IntegrationId: item.IntegrationId,
		RepoUrl:       item.RepoUrl,
		DefaultBranch: item.DefaultBranch,
		BuildConfig:   item.BuildConfig,
		DeploySpec:    item.DeploySpec,
		Status:        item.Status,
		CreateTime:    item.CreateTime,
		UpdateTime:    item.UpdateTime,
	}
}

func toEnvVO(item *titan.EnvItem) types.EnvVO {
	if item == nil {
		return types.EnvVO{}
	}
	return types.EnvVO{
		Id:          item.Id,
		ProjectId:   item.ProjectId,
		EnvCode:     item.EnvCode,
		Name:        item.Name,
		ClusterId:   item.ClusterId,
		ClusterName: item.ClusterName,
		Namespace:   item.Namespace,
		Status:      item.Status,
		AppCount:    item.AppCount,
		CreateTime:  item.CreateTime,
		UpdateTime:  item.UpdateTime,
	}
}

func toArtifactVO(item *titan.ArtifactItem) types.ArtifactVO {
	if item == nil {
		return types.ArtifactVO{}
	}
	return types.ArtifactVO{
		Id:             item.Id,
		ProjectId:      item.ProjectId,
		AppId:          item.AppId,
		AppName:        item.AppName,
		ImageUrl:       item.ImageUrl,
		ImageTag:       item.ImageTag,
		ImageDigest:    item.ImageDigest,
		GitBranch:      item.GitBranch,
		GitCommit:      item.GitCommit,
		CommitMsg:      item.CommitMsg,
		BuildExecId:    item.BuildExecId,
		ImageSizeBytes: item.ImageSizeBytes,
		Status:         item.Status,
		CreateTime:     item.CreateTime,
	}
}

func toReleaseOrderVO(item *titan.ReleaseOrderItem) types.ReleaseOrderVO {
	if item == nil {
		return types.ReleaseOrderVO{}
	}
	return types.ReleaseOrderVO{
		Id:                item.Id,
		OrderNo:           item.OrderNo,
		ProjectId:         item.ProjectId,
		Title:             item.Title,
		Description:       item.Description,
		TargetEnv:         item.TargetEnv,
		ServicesJson:      item.ServicesJson,
		Status:            item.Status,
		ItsmProcessInstId: item.ItsmProcessInstId,
		ApplicantId:       item.ApplicantId,
		ApplicantName:     item.ApplicantName,
		ApproverId:        item.ApproverId,
		ApproverName:      item.ApproverName,
		ScheduledTime:     item.ScheduledTime,
		StartTime:         item.StartTime,
		EndTime:           item.EndTime,
		CreateTime:        item.CreateTime,
		UpdateTime:        item.UpdateTime,
	}
}

