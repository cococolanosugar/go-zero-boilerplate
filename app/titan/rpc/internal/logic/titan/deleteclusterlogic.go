package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
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

func (l *DeleteClusterLogic) DeleteCluster(in *titan.DeleteClusterReq) (*titan.CommonResp, error) {
	if err := l.svcCtx.ClusterModel.Delete(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("删除集群失败: " + err.Error())
	}
	return &titan.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
