package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateAppLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateAppLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateAppLogic {
	return &CreateAppLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateAppLogic) CreateApp(in *titan.CreateAppReq) (*titan.CreateAppResp, error) {
	buildCfg := in.BuildConfig
	if buildCfg == "" {
		buildCfg = "{}"
	}
	deploySpec := in.DeploySpec
	if deploySpec == "" {
		deploySpec = ""
	}

	res, err := l.svcCtx.AppModel.Insert(l.ctx, &model.TitanApp{
		ProjectId:     in.ProjectId,
		Name:          in.Name,
		DisplayName:   in.DisplayName,
		Description:   in.Description,
		IntegrationId: in.IntegrationId,
		RepoUrl:       in.RepoUrl,
		DefaultBranch: in.DefaultBranch,
		BuildConfig:   buildCfg,
		DeploySpec:    deploySpec,
		Status:        1,
	})
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &titan.CreateAppResp{
		Id: id,
	}, nil
}
