package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateArtifactLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateArtifactLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateArtifactLogic {
	return &CreateArtifactLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateArtifactLogic) CreateArtifact(req *types.CreateArtifactReqVO) (resp *types.CreateArtifactRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.CreateArtifact(l.ctx, &titan.CreateArtifactReq{
		ProjectId:      req.ProjectId,
		AppId:          req.AppId,
		ImageUrl:       req.ImageUrl,
		ImageTag:       req.ImageTag,
		ImageDigest:    req.ImageDigest,
		GitBranch:      req.GitBranch,
		GitCommit:      req.GitCommit,
		CommitMsg:      req.CommitMsg,
		BuildExecId:    req.BuildExecId,
		ImageSizeBytes: req.ImageSizeBytes,
	})
	if err != nil {
		return nil, err
	}

	return &types.CreateArtifactRespVO{
		Id: res.Id,
	}, nil
}
