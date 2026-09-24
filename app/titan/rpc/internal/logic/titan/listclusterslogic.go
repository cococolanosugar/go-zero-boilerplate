package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListClustersLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListClustersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListClustersLogic {
	return &ListClustersLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// ListClusters 列表不含 kubeconfig 凭据文本
func (l *ListClustersLogic) ListClusters(in *titan.ListClustersReq) (*titan.ListClustersResp, error) {
	offset, limit := normalizePage(int64(in.Page), int64(in.PageSize))

	clusters, total, err := l.svcCtx.ClusterModel.ListByPage(l.ctx, in.Env, offset, limit)
	if err != nil {
		return nil, xerr.NewErrMsg("查询集群列表失败: " + err.Error())
	}

	var list []*titan.ClusterItem
	for _, c := range clusters {
		list = append(list, &titan.ClusterItem{
			Id:          c.Id,
			Name:        c.Name,
			Env:         c.Env,
			ApiEndpoint: c.ApiEndpoint,
			Status:      c.Status,
			Version:     c.Version,
			Description: c.Description,
			CreatedBy:   c.CreatedBy,
			CreateTime:  formatTime(c.CreateTime),
			UpdateTime:  formatTime(c.UpdateTime),
		})
	}

	return &titan.ListClustersResp{
		Total: total,
		List:  list,
	}, nil
}
