package devopslogic

import (
	"context"

	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/devops/rpc/internal/svc"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteClusterLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteClusterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteClusterLogic {
	return &DeleteClusterLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteClusterLogic) DeleteCluster(in *devops.DeleteClusterReq) (*devops.CommonResp, error) {
	if err := l.svcCtx.ClusterModel.Delete(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("删除集群失败: " + err.Error())
	}
	return &devops.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
