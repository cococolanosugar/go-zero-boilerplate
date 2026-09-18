package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"

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

func (l *ListClustersLogic) ListClusters(in *titan.ListClustersReq) (*titan.ListClustersResp, error) {
	page := in.Page
	if page <= 0 {
		page = 1
	}
	pageSize := in.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	where := "WHERE 1=1"
	var args []interface{}
	if in.Env != "" {
		where += " AND env = ?"
		args = append(args, in.Env)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM titan_cluster %s", where)
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countQuery, args...); err != nil {
		return nil, err
	}

	var clusters []*model.TitanCluster
	listQuery := fmt.Sprintf("SELECT id, name, env, api_endpoint, kubeconfig, status, version, description, created_by, create_time, update_time FROM titan_cluster %s ORDER BY id DESC LIMIT %d, %d", where, offset, pageSize)
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &clusters, listQuery, args...); err != nil {
		return nil, err
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
			CreateTime:  c.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:  c.UpdateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &titan.ListClustersResp{
		Total: total,
		List:  list,
	}, nil
}
