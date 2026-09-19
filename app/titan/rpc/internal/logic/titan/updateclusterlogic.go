package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/pkg/cryptox"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateClusterLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateClusterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateClusterLogic {
	return &UpdateClusterLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// UpdateCluster 采用"字段显式提供才更新"语义：proto optional 指针为 nil 表示不更新。
func (l *UpdateClusterLogic) UpdateCluster(in *titan.UpdateClusterReq) (*titan.CommonResp, error) {
	cluster, err := l.svcCtx.ClusterModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "集群")
	}

	if in.Name != nil {
		cluster.Name = *in.Name
	}
	if in.Env != nil {
		cluster.Env = *in.Env
	}
	if in.ApiEndpoint != nil {
		cluster.ApiEndpoint = *in.ApiEndpoint
	}
	if in.Kubeconfig != nil {
		encryptedKube, err := cryptox.Encrypt(*in.Kubeconfig, "")
		if err != nil {
			return nil, xerr.NewErrMsg("加密 Kubeconfig 失败: " + err.Error())
		}
		cluster.Kubeconfig = encryptedKube
	}
	if in.Description != nil {
		cluster.Description = *in.Description
	}

	if err := l.svcCtx.ClusterModel.Update(l.ctx, cluster); err != nil {
		return nil, xerr.NewErrMsg("更新集群失败: " + err.Error())
	}

	return &titan.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
