package titanlogic

import (
	"context"
	"encoding/json"
	"fmt"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/jenkins"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/pkg/cryptox"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type TestIntegrationLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewTestIntegrationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TestIntegrationLogic {
	return &TestIntegrationLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *TestIntegrationLogic) TestIntegration(in *titan.TestIntegrationReq) (*titan.TestIntegrationResp, error) {
	item, err := l.svcCtx.IntegrationModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrMsg("集成凭据不存在")
	}

	rawCfg, err := cryptox.Decrypt(item.Config, "")
	if err != nil {
		return nil, xerr.NewErrMsg("解密凭据配置失败: " + err.Error())
	}

	switch item.Category {
	case "jenkins":
		var jCfg jenkins.Config
		if err := json.Unmarshal([]byte(rawCfg), &jCfg); err != nil {
			return &titan.TestIntegrationResp{
				Success: false,
				Message: "Jenkins 配置格式错误: " + err.Error(),
			}, nil
		}

		client := jenkins.NewClient(jCfg)
		version, err := client.TestConnection(l.ctx)
		if err != nil {
			return &titan.TestIntegrationResp{
				Success: false,
				Message: "连接 Jenkins 失败: " + err.Error(),
			}, nil
		}
		return &titan.TestIntegrationResp{
			Success: true,
			Message: fmt.Sprintf("连接成功，Jenkins 版本: %s", version),
		}, nil
	default:
		return &titan.TestIntegrationResp{
			Success: true,
			Message: "凭据解密与格式校验通过",
		}, nil
	}
}
