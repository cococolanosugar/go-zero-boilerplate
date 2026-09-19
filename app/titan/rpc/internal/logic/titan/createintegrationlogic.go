package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/pkg/cryptox"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateIntegrationLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateIntegrationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateIntegrationLogic {
	return &CreateIntegrationLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateIntegrationLogic) CreateIntegration(in *titan.CreateIntegrationReq) (*titan.CreateIntegrationResp, error) {
	if in.Name == "" || in.Config == "" {
		return nil, xerr.NewErrMsg("集成名称与配置信息不能为空")
	}

	encryptedConfig, err := cryptox.Encrypt(in.Config, "")
	if err != nil {
		return nil, xerr.NewErrMsg("加密集成配置失败: " + err.Error())
	}

	res, err := l.svcCtx.IntegrationModel.Insert(l.ctx, &model.TitanIntegration{
		Name:        in.Name,
		Category:    in.Category,
		AuthType:    in.AuthType,
		Config:      encryptedConfig,
		Status:      1,
		Description: in.Description,
		CreatedBy:   in.CreatedBy,
	})
	if err != nil {
		return nil, xerr.NewErrMsg("创建集成凭据失败: " + err.Error())
	}

	id, _ := res.LastInsertId()
	return &titan.CreateIntegrationResp{Id: id}, nil
}
