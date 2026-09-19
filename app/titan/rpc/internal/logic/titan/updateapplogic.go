package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

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

// UpdateApp 采用"字段显式提供才更新"语义：proto optional 指针为 nil 表示不更新，
// 显式提供零值（如空串、0）才允许清空/重置该字段。
func (l *UpdateAppLogic) UpdateApp(in *titan.UpdateAppReq) (*titan.CommonResp, error) {
	a, err := l.svcCtx.AppModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "应用")
	}

	if in.Name != nil {
		a.Name = *in.Name
	}
	if in.DisplayName != nil {
		a.DisplayName = *in.DisplayName
	}
	if in.Description != nil {
		a.Description = *in.Description
	}
	if in.IntegrationId != nil {
		a.IntegrationId = *in.IntegrationId
	}
	if in.RepoUrl != nil {
		a.RepoUrl = *in.RepoUrl
	}
	if in.DefaultBranch != nil {
		a.DefaultBranch = *in.DefaultBranch
	}
	if in.BuildConfig != nil {
		a.BuildConfig = *in.BuildConfig
	}
	if in.DeploySpec != nil {
		a.DeploySpec = *in.DeploySpec
	}
	if in.Status != nil {
		a.Status = int64(*in.Status)
	}

	if err := l.svcCtx.AppModel.Update(l.ctx, a); err != nil {
		return nil, xerr.NewErrMsg("更新应用失败: " + err.Error())
	}

	return &titan.CommonResp{
		Code: 200,
		Msg:  "SUCCESS",
	}, nil
}
