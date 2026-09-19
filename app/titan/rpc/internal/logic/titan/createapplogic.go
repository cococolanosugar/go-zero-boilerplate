package titanlogic

import (
	"context"
	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"
	"strings"

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
	// 非空校验
	if strings.TrimSpace(in.Name) == "" {
		return nil, xerr.NewErrMsg("应用标识 (name) 不能为空")
	}
	if strings.TrimSpace(in.DisplayName) == "" {
		return nil, xerr.NewErrMsg("应用名称 (displayName) 不能为空")
	}
	// 外键存在性校验：项目必须存在
	if _, err := l.svcCtx.ProjectModel.FindOne(l.ctx, in.ProjectId); err != nil {
		return nil, notFoundOrError(err, "所属项目")
	}
	// 集成凭证可选，但提供时必须存在
	if in.IntegrationId > 0 {
		if _, err := l.svcCtx.IntegrationModel.FindOne(l.ctx, in.IntegrationId); err != nil {
			return nil, notFoundOrError(err, "集成凭证")
		}
	}

	buildCfg := in.BuildConfig
	if buildCfg == "" {
		buildCfg = "{}"
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
		DeploySpec:    in.DeploySpec,
		Status:        1,
	})
	if err != nil {
		return nil, xerr.NewErrMsg("创建应用失败: " + err.Error())
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, xerr.NewErrMsg("获取应用ID失败: " + err.Error())
	}

	return &titan.CreateAppResp{
		Id: id,
	}, nil
}
