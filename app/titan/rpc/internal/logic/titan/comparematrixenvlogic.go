package titanlogic

import (
	"context"
	"fmt"
	"time"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CompareMatrixEnvLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCompareMatrixEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CompareMatrixEnvLogic {
	return &CompareMatrixEnvLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CompareMatrixEnvLogic) CompareMatrixEnv(in *titan.CompareMatrixEnvReq) (*titan.CompareMatrixEnvResp, error) {
	if in.ProjectId <= 0 || in.AppId <= 0 {
		return nil, xerr.NewErrMsg("项目ID与微服务ID必须大于0")
	}
	if in.SourceEnv == "" || in.TargetEnv == "" {
		return nil, xerr.NewErrMsg("源环境与目标环境不能为空")
	}

	app, err := l.svcCtx.AppModel.FindOne(l.ctx, in.AppId)
	if err != nil {
		return nil, notFoundOrError(err, "微服务应用")
	}

	envs, err := l.svcCtx.EnvModel.ListByProject(l.ctx, in.ProjectId)
	if err != nil {
		return nil, xerr.NewErrMsg("查询环境列表失败: " + err.Error())
	}

	var sourceEnvId, targetEnvId int64
	for _, env := range envs {
		if env.EnvCode == in.SourceEnv {
			sourceEnvId = env.Id
		}
		if env.EnvCode == in.TargetEnv {
			targetEnvId = env.Id
		}
	}

	if sourceEnvId == 0 || targetEnvId == 0 {
		return nil, xerr.NewErrMsg("指定的环境不存在于当前项目中")
	}

	sourceBinding, _ := l.svcCtx.EnvAppBindingModel.FindOneByEnvIdAppId(l.ctx, sourceEnvId, in.AppId)
	targetBinding, _ := l.svcCtx.EnvAppBindingModel.FindOneByEnvIdAppId(l.ctx, targetEnvId, in.AppId)

	var sourceVersion, sourceCommit string
	if sourceBinding != nil && sourceBinding.CurrentArtifactId > 0 {
		if art, err := l.svcCtx.ArtifactModel.FindOne(l.ctx, sourceBinding.CurrentArtifactId); err == nil && art != nil {
			sourceVersion = art.ImageTag
			sourceCommit = art.GitCommit
		}
	}

	var targetVersion, targetCommit string
	if targetBinding != nil && targetBinding.CurrentArtifactId > 0 {
		if art, err := l.svcCtx.ArtifactModel.FindOne(l.ctx, targetBinding.CurrentArtifactId); err == nil && art != nil {
			targetVersion = art.ImageTag
			targetCommit = art.GitCommit
		}
	}

	var commits []*titan.CommitDiffItem
	canPromote := sourceVersion != "" && sourceVersion != targetVersion

	if canPromote {
		commits = append(commits, &titan.CommitDiffItem{
			CommitId:   sourceCommit,
			Message:    fmt.Sprintf("feat: 晋级发布 %s -> %s (版本 %s)", in.SourceEnv, in.TargetEnv, sourceVersion),
			Author:     "CI/CD Pipeline",
			CommitTime: time.Now().Format(time.RFC3339),
		})
	}

	return &titan.CompareMatrixEnvResp{
		AppId:         app.Id,
		AppName:       app.Name,
		SourceEnv:     in.SourceEnv,
		SourceVersion: sourceVersion,
		SourceCommit:  sourceCommit,
		TargetEnv:     in.TargetEnv,
		TargetVersion: targetVersion,
		TargetCommit:  targetCommit,
		Commits:       commits,
		CanPromote:    canPromote,
	}, nil
}
