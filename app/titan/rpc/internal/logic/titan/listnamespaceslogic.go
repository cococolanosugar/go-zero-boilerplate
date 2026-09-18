package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/k8s"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/pkg/cryptox"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListNamespacesLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListNamespacesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListNamespacesLogic {
	return &ListNamespacesLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListNamespacesLogic) ListNamespaces(in *titan.ListNamespacesReq) (*titan.ListNamespacesResp, error) {
	cluster, err := l.svcCtx.ClusterModel.FindOne(l.ctx, in.ClusterId)
	if err != nil {
		return nil, xerr.NewErrMsg("集群不存在")
	}

	kubeconfig, err := cryptox.Decrypt(cluster.Kubeconfig, "")
	if err != nil {
		return nil, xerr.NewErrMsg("解密 Kubeconfig 失败: " + err.Error())
	}

	restCfg, err := k8s.BuildConfigFromKubeconfig(kubeconfig)
	if err != nil {
		return nil, xerr.NewErrMsg("解析 Kubeconfig 失败: " + err.Error())
	}

	cm, err := k8s.NewClusterManager(restCfg)
	if err != nil {
		return nil, xerr.NewErrMsg("初始化集群客户端失败: " + err.Error())
	}

	namespaces, err := cm.ListNamespaces(l.ctx)
	if err != nil {
		return nil, xerr.NewErrMsg("获取命名空间列表失败: " + err.Error())
	}

	return &titan.ListNamespacesResp{
		Namespaces: namespaces,
	}, nil
}
