package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateAppLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateAppLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateAppLogic {
	return &UpdateAppLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateAppLogic) UpdateApp(req *types.UpdateAppReqVO) error {
	_, err := l.svcCtx.TitanRpc.UpdateApp(l.ctx, &titan.UpdateAppReq{
		Id:            req.Id,
		Name:          req.Name,
		DisplayName:   req.DisplayName,
		Description:   req.Description,
		IntegrationId: req.IntegrationId,
		RepoUrl:       req.RepoUrl,
		DefaultBranch: req.DefaultBranch,
		BuildConfig:   req.BuildConfig,
		DeploySpec:    req.DeploySpec,
		Status:        req.Status,
	})
	return err
}
