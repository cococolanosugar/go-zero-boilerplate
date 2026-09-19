package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
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

// UpdateIntegration 采用"字段显式提供才更新"语义：proto optional 指针为 nil 表示不更新。
// config 提交值匹配掩码格式（****开头）时跳过，保留库中原值，避免脱敏值覆盖真实密钥。
func (l *UpdateIntegrationLogic) UpdateIntegration(in *titan.UpdateIntegrationReq) (*titan.CommonResp, error) {
	item, err := l.svcCtx.IntegrationModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "集成凭证")
	}

	if in.Name != nil {
		item.Name = *in.Name
	}
	if in.AuthType != nil {
		item.AuthType = *in.AuthType
	}
	if in.Config != nil {
		if isMaskedValue(*in.Config) {
			l.Logger.Infof("集成 %d 的 config 提交值为掩码, 跳过更新保留原值", in.Id)
		} else {
			encryptedConfig, err := cryptox.Encrypt(*in.Config, "")
			if err != nil {
				return nil, xerr.NewErrMsg("加密集成配置失败: " + err.Error())
			}
			item.Config = encryptedConfig
		}
	}
	if in.Status != nil {
		item.Status = int64(*in.Status)
	}
	if in.Description != nil {
		item.Description = *in.Description
	}

	if err := l.svcCtx.IntegrationModel.Update(l.ctx, item); err != nil {
		return nil, xerr.NewErrMsg("更新集成凭证失败: " + err.Error())
	}

	return &titan.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
