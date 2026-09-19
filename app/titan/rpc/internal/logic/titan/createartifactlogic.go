package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

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
		Status:         "AVAILABLE",
	})
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &titan.CreateArtifactResp{
		Id: id,
	}, nil
}
