package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateAppLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateAppLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateAppLogic {
	return &CreateAppLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateAppLogic) CreateApp(req *types.CreateAppReqVO) (resp *types.CreateAppRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.CreateApp(l.ctx, &titan.CreateAppReq{
		ProjectId:     req.ProjectId,
		Name:          req.Name,
		DisplayName:   req.DisplayName,
		Description:   req.Description,
		IntegrationId: req.IntegrationId,
		RepoUrl:       req.RepoUrl,
		DefaultBranch: req.DefaultBranch,
		BuildConfig:   req.BuildConfig,
		DeploySpec:    req.DeploySpec,
	})
	if err != nil {
		return nil, err
	}

	return &types.CreateAppRespVO{
		Id: res.Id,
	}, nil
}
