package devopslogic

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/devops/rpc/internal/k8s"
	"go-zero-boilerplate/app/devops/rpc/internal/svc"
	"go-zero-boilerplate/pkg/cryptox"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type TestClusterLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewTestClusterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TestClusterLogic {
	return &TestClusterLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *TestClusterLogic) TestCluster(in *devops.TestClusterReq) (*devops.TestClusterResp, error) {
	cluster, err := l.svcCtx.ClusterModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrMsg("集群不存在")
	}

	kubeconfig, err := cryptox.Decrypt(cluster.Kubeconfig, "")
	if err != nil {
		return nil, xerr.NewErrMsg("解密 Kubeconfig 失败: " + err.Error())
	}

	restCfg, err := k8s.BuildConfigFromKubeconfig(kubeconfig)
	if err != nil {
		return &devops.TestClusterResp{
			Success: false,
			Message: "无效的 Kubeconfig: " + err.Error(),
		}, nil
	}

	cm, err := k8s.NewClusterManager(restCfg)
	if err != nil {
		return &devops.TestClusterResp{
			Success: false,
			Message: "创建集群客户端失败: " + err.Error(),
		}, nil
	}

	ver, err := cm.TestConnection(l.ctx)
	if err != nil {
		cluster.Status = "UNREACHABLE"
		_ = l.svcCtx.ClusterModel.Update(l.ctx, cluster)
		return &devops.TestClusterResp{
			Success: false,
			Message: "连接集群失败: " + err.Error(),
		}, nil
	}

	cluster.Status = "HEALTHY"
	cluster.Version = ver
	_ = l.svcCtx.ClusterModel.Update(l.ctx, cluster)

	return &devops.TestClusterResp{
		Success: true,
		Version: ver,
		Message: "连接正常",
	}, nil
}
