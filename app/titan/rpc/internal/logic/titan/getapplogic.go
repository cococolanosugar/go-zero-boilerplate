package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetAppLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetAppLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAppLogic {
	return &GetAppLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetAppLogic) GetApp(in *titan.GetAppReq) (*titan.AppDetailResp, error) {
	a, err := l.svcCtx.AppModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, err
	}

	return &titan.AppDetailResp{
		App: &titan.AppItem{
			Id:            a.Id,
			ProjectId:     a.ProjectId,
			Name:          a.Name,
			DisplayName:   a.DisplayName,
			Description:   a.Description,
			IntegrationId: a.IntegrationId,
			RepoUrl:       a.RepoUrl,
			DefaultBranch: a.DefaultBranch,
			BuildConfig:   a.BuildConfig,
			DeploySpec:    a.DeploySpec,
			Status:        int32(a.Status),
			CreateTime:    a.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:    a.UpdateTime.Format("2006-01-02 15:04:05"),
		},
	}, nil
}
