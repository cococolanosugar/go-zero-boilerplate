package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListEnvsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListEnvsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListEnvsLogic {
	return &ListEnvsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListEnvsLogic) ListEnvs(in *titan.ListEnvsReq) (*titan.ListEnvsResp, error) {
	var envs []*model.TitanEnv
	query := "SELECT id, project_id, env_code, name, cluster_id, namespace, status, create_time, update_time FROM titan_env WHERE project_id = ? ORDER BY id ASC"
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &envs, query, in.ProjectId); err != nil {
		return nil, err
	}

	var list []*titan.EnvItem
	for _, e := range envs {
		var clusterName string
		cluster, err := l.svcCtx.ClusterModel.FindOne(l.ctx, e.ClusterId)
		if err == nil && cluster != nil {
			clusterName = cluster.Name
		}

		var appCount int32
		_ = l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &appCount, "SELECT COUNT(*) FROM titan_env_app_binding WHERE env_id = ?", e.Id)

		list = append(list, &titan.EnvItem{
			Id:          e.Id,
			ProjectId:   e.ProjectId,
			EnvCode:     e.EnvCode,
			Name:        e.Name,
			ClusterId:   e.ClusterId,
			ClusterName: clusterName,
			Namespace:   e.Namespace,
			Status:      e.Status,
			AppCount:    appCount,
			CreateTime:  e.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:  e.UpdateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &titan.ListEnvsResp{
		List: list,
	}, nil
}
