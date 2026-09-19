package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateAppLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateAppLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateAppLogic {
	return &UpdateAppLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateAppLogic) UpdateApp(in *titan.UpdateAppReq) (*titan.CommonResp, error) {
	a, err := l.svcCtx.AppModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, err
	}

	if in.Name != "" {
		a.Name = in.Name
	}
	if in.DisplayName != "" {
		a.DisplayName = in.DisplayName
	}
	if in.Description != "" {
		a.Description = in.Description
	}
	if in.IntegrationId > 0 {
		a.IntegrationId = in.IntegrationId
	}
	if in.RepoUrl != "" {
		a.RepoUrl = in.RepoUrl
	}
	if in.DefaultBranch != "" {
		a.DefaultBranch = in.DefaultBranch
	}
	if in.BuildConfig != "" {
		a.BuildConfig = in.BuildConfig
	}
	if in.DeploySpec != "" {
		a.DeploySpec = in.DeploySpec
	}
	if in.Status > 0 {
		a.Status = int64(in.Status)
	}

	if err := l.svcCtx.AppModel.Update(l.ctx, a); err != nil {
		return nil, err
	}

	return &titan.CommonResp{
		Code: 200,
		Msg:  "SUCCESS",
	}, nil
}
