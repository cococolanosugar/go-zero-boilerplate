package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/guard"
	"go-zero-boilerplate/app/titan/rpc/internal/k8s"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
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

// TestCluster 连通性测试并回写集群健康状态：
// API 端点过 SSRF 校验（环回/元数据地址始终拒绝，私有网段由策略开关控制），
// 状态回写使用统一状态常量。
func (l *TestClusterLogic) TestCluster(in *titan.TestClusterReq) (*titan.TestClusterResp, error) {
	cluster, err := l.svcCtx.ClusterModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "集群")
	}

	kubeconfig, err := cryptox.Decrypt(cluster.Kubeconfig, "")
	if err != nil {
		return nil, xerr.NewErrMsg("解密 Kubeconfig 失败")
	}

	restCfg, err := k8s.BuildConfigFromKubeconfig(kubeconfig)
	if err != nil {
		return &titan.TestClusterResp{
			Success: false,
			Message: "无效的 Kubeconfig",
		}, nil
	}

	// 集群 API 端点过 SSRF 校验
	policy := guard.Policy{AllowPrivateRanges: l.svcCtx.Config.Guard.AllowPrivateNetwork}
	if gErr := guard.CheckOutboundTarget(l.ctx, restCfg.Host, policy); gErr != nil {
		return &titan.TestClusterResp{
			Success: false,
			Message: "集群地址不被允许: " + gErr.Error(),
		}, nil
	}

	cm, err := k8s.NewClusterManager(restCfg)
	if err != nil {
		return &titan.TestClusterResp{
			Success: false,
			Message: "创建集群客户端失败",
		}, nil
	}

	ver, err := cm.TestConnection(l.ctx)
	if err != nil {
		cluster.Status = model.ClusterStatusUnhealthy
		_ = l.svcCtx.ClusterModel.Update(l.ctx, cluster)
		return &titan.TestClusterResp{
			Success: false,
			Message: "无法连接至集群 API，请检查地址与凭据",
		}, nil
	}

	cluster.Status = model.ClusterStatusHealthy
	cluster.Version = ver
	if uErr := l.svcCtx.ClusterModel.Update(l.ctx, cluster); uErr != nil {
		l.Errorf("回写集群健康状态失败 id=%d: %v", cluster.Id, uErr)
	}

	return &titan.TestClusterResp{
		Success: true,
		Version: ver,
		Message: "连接正常",
	}, nil
}
