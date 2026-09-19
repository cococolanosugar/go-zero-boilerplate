package titanlogic

import (
	"context"
	"fmt"
	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateArtifactLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateArtifactLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateArtifactLogic {
	return &CreateArtifactLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateArtifactLogic) CreateArtifact(in *titan.CreateArtifactReq) (*titan.CreateArtifactResp, error) {
	// 外键存在性校验：项目与应用必须存在，且应用归属该项目
	project, err := l.svcCtx.ProjectModel.FindOne(l.ctx, in.ProjectId)
	if err != nil {
		return nil, notFoundOrError(err, "所属项目")
	}
	app, err := l.svcCtx.AppModel.FindOne(l.ctx, in.AppId)
	if err != nil {
		return nil, notFoundOrError(err, "应用")
	}
	if app.ProjectId != project.Id {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}
	// 镜像引用格式校验
	if err := validateImageRef(fmt.Sprintf("%s:%s", in.ImageUrl, in.ImageTag)); err != nil {
		return nil, xerr.NewErrMsg("制品镜像引用非法: " + err.Error())
	}

	res, err := l.svcCtx.ArtifactModel.Insert(l.ctx, &model.TitanArtifact{
		ProjectId:      in.ProjectId,
		AppId:          in.AppId,
		ImageUrl:       in.ImageUrl,
		ImageTag:       in.ImageTag,
		ImageDigest:    in.ImageDigest,
		GitBranch:      in.GitBranch,
		GitCommit:      in.GitCommit,
		CommitMsg:      in.CommitMsg,
		BuildExecId:    in.BuildExecId,
		ImageSizeBytes: in.ImageSizeBytes,
		Status:         model.ArtifactStatusAvailable,
	})
	if err != nil {
		return nil, xerr.NewErrMsg("创建制品失败: " + err.Error())
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, xerr.NewErrMsg("获取制品ID失败: " + err.Error())
	}

	return &titan.CreateArtifactResp{
		Id: id,
	}, nil
}
