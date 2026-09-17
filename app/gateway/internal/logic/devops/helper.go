package devops

import (
	"context"
	"encoding/json"

	"go-zero-boilerplate/app/devops/rpc/devops"
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

func toIntegrationVO(item *devops.IntegrationItem) types.IntegrationVO {
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

func toClusterVO(item *devops.ClusterItem) types.ClusterVO {
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

func toPipelineVO(item *devops.PipelineItem) types.PipelineVO {
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

func toExecutionVO(item *devops.ExecutionItem) types.ExecutionVO {
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

func toStepExecVO(item *devops.StepExecItem) types.StepExecVO {
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
