package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

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
	page := in.Page
	if page <= 0 {
		page = 1
	}
	pageSize := in.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	where := "WHERE 1=1"
	var args []interface{}
	if in.ProjectId > 0 {
		where += " AND project_id = ?"
		args = append(args, in.ProjectId)
	}
	if in.AppId > 0 {
		where += " AND app_id = ?"
		args = append(args, in.AppId)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM titan_artifact %s", where)
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countQuery, args...); err != nil {
		return nil, err
	}

	var artifacts []*model.TitanArtifact
	listQuery := fmt.Sprintf("SELECT id, project_id, app_id, image_url, image_tag, image_digest, git_branch, git_commit, commit_msg, build_exec_id, image_size_bytes, status, create_time, update_time FROM titan_artifact %s ORDER BY id DESC LIMIT %d, %d", where, offset, pageSize)
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &artifacts, listQuery, args...); err != nil {
		return nil, err
	}

	var list []*titan.ArtifactItem
	for _, art := range artifacts {
		var appName string
		app, err := l.svcCtx.AppModel.FindOne(l.ctx, art.AppId)
		if err == nil && app != nil {
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
			CreateTime:     art.CreateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &titan.ListArtifactsResp{
		Total: total,
		List:  list,
	}, nil
}
