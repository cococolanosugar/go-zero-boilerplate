package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/k8s"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/pkg/cryptox"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateClusterLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateClusterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateClusterLogic {
	return &CreateClusterLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateClusterLogic) CreateCluster(in *titan.CreateClusterReq) (*titan.CreateClusterResp, error) {
	if in.Name == "" || in.Kubeconfig == "" {
		return nil, xerr.NewErrMsg("集群名称和 Kubeconfig 不能为空")
	}

	// 校验 Kubeconfig 语法有效性
	restCfg, err := k8s.BuildConfigFromKubeconfig(in.Kubeconfig)
	if err != nil {
		return nil, xerr.NewErrMsg("无效的 Kubeconfig 配置: " + err.Error())
	}

	version := "unknown"
	status := model.ClusterStatusHealthy
	cm, err := k8s.NewClusterManager(restCfg)
	if err == nil {
		if ver, err := cm.TestConnection(l.ctx); err == nil {
			version = ver
		} else {
			status = "UNREACHABLE"
		}
	}

	// 加密 Kubeconfig
	encryptedKube, err := cryptox.Encrypt(in.Kubeconfig, "")
	if err != nil {
		return nil, xerr.NewErrMsg("加密 Kubeconfig 失败: " + err.Error())
	}

	res, err := l.svcCtx.ClusterModel.Insert(l.ctx, &model.TitanCluster{
		Name:        in.Name,
		Env:         in.Env,
		ApiEndpoint: in.ApiEndpoint,
		Kubeconfig:  encryptedKube,
		Status:      status,
		Version:     version,
		Description: in.Description,
		CreatedBy:   in.CreatedBy,
	})
	if err != nil {
		return nil, xerr.NewErrMsg("创建集群失败: " + err.Error())
	}

	id, _ := res.LastInsertId()
	return &titan.CreateClusterResp{Id: id}, nil
}
