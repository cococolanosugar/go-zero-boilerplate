package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeployArtifactLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeployArtifactLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeployArtifactLogic {
	return &DeployArtifactLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeployArtifactLogic) DeployArtifact(req *types.DeployArtifactReqVO) error {
	userId := getUserIdFromCtx(l.ctx)
	_, err := l.svcCtx.TitanRpc.DeployArtifact(l.ctx, &titan.DeployArtifactReq{
		EnvId:      req.Id,
		AppId:      req.AppId,
		ArtifactId: req.ArtifactId,
		ProjectId:  req.ProjectId,
		OperatorId: userId,
	})
	return err
}
