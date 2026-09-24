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

type CreateEnvLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateEnvLogic {
	return &CreateEnvLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateEnvLogic) CreateEnv(in *titan.CreateEnvReq) (*titan.CreateEnvResp, error) {
	// 非空校验
	if strings.TrimSpace(in.Name) == "" {
		return nil, xerr.NewErrMsg("环境名称 (name) 不能为空")
	}
	if strings.TrimSpace(in.EnvCode) == "" {
		return nil, xerr.NewErrMsg("环境标识 (envCode) 不能为空")
	}
	// 外键存在性校验：项目与集群必须存在
	if _, err := l.svcCtx.ProjectModel.FindOne(l.ctx, in.ProjectId); err != nil {
		return nil, notFoundOrError(err, "所属项目")
	}
	if _, err := l.svcCtx.ClusterModel.FindOne(l.ctx, in.ClusterId); err != nil {
		return nil, notFoundOrError(err, "集群")
	}

	res, err := l.svcCtx.EnvModel.Insert(l.ctx, &model.TitanEnv{
		ProjectId: in.ProjectId,
		EnvCode:   in.EnvCode,
		Name:      in.Name,
		ClusterId: in.ClusterId,
		Namespace: in.Namespace,
		Status:    model.EnvStatusActive,
	})
	if err != nil {
		return nil, xerr.NewErrMsg("创建环境失败: " + err.Error())
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, xerr.NewErrMsg("获取环境ID失败: " + err.Error())
	}

	return &titan.CreateEnvResp{
		Id: id,
	}, nil
}
