package devopslogic

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/devops/rpc/internal/svc"
	"go-zero-boilerplate/pkg/cryptox"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateIntegrationLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateIntegrationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateIntegrationLogic {
	return &UpdateIntegrationLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateIntegrationLogic) UpdateIntegration(in *devops.UpdateIntegrationReq) (*devops.CommonResp, error) {
	item, err := l.svcCtx.IntegrationModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrMsg("集成凭证不存在")
	}

	if in.Name != "" {
		item.Name = in.Name
	}
	if in.AuthType != "" {
		item.AuthType = in.AuthType
	}
	if in.Config != "" {
		encryptedConfig, err := cryptox.Encrypt(in.Config, "")
		if err != nil {
			return nil, xerr.NewErrMsg("加密集成配置失败: " + err.Error())
		}
		item.Config = encryptedConfig
	}
	item.Status = int64(in.Status)
	item.Description = in.Description

	if err := l.svcCtx.IntegrationModel.Update(l.ctx, item); err != nil {
		return nil, xerr.NewErrMsg("更新集成凭证失败: " + err.Error())
	}

	return &devops.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
