package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListArtifactsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListArtifactsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListArtifactsLogic {
	return &ListArtifactsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListArtifactsLogic) ListArtifacts(in *titan.ListArtifactsReq) (*titan.ListArtifactsResp, error) {
	offset, limit := normalizePage(int64(in.Page), int64(in.PageSize))

	artifacts, total, err := l.svcCtx.ArtifactModel.ListByPage(l.ctx, in.ProjectId, in.AppId, offset, limit)
	if err != nil {
		return nil, xerr.NewErrMsg("查询制品列表失败: " + err.Error())
	}

	// 批量取应用名（消除 N+1）
	appIds := make([]int64, 0, len(artifacts))
	for _, art := range artifacts {
		appIds = append(appIds, art.AppId)
	}
	apps, err := l.svcCtx.AppModel.FindByIds(l.ctx, appIds)
	if err != nil {
		return nil, xerr.NewErrMsg("批量查询应用失败: " + err.Error())
	}

	var list []*titan.ArtifactItem
	for _, art := range artifacts {
		var appName string
		if app, ok := apps[art.AppId]; ok {
			appName = app.DisplayName
			if appName == "" {
				appName = app.Name
			}
		}
		list = append(list, &titan.ArtifactItem{
			Id:             art.Id,
			ProjectId:      art.ProjectId,
			AppId:          art.AppId,
			AppName:        appName,
			ImageUrl:       art.ImageUrl,
			ImageTag:       art.ImageTag,
			ImageDigest:    art.ImageDigest,
			GitBranch:      art.GitBranch,
			GitCommit:      art.GitCommit,
			CommitMsg:      art.CommitMsg,
			BuildExecId:    art.BuildExecId,
			ImageSizeBytes: art.ImageSizeBytes,
			Status:         art.Status,
			CreateTime:     formatTime(art.CreateTime),
			UpdateTime:     formatTime(art.UpdateTime),
		})
	}

	return &titan.ListArtifactsResp{
		Total: total,
		List:  list,
	}, nil
}
