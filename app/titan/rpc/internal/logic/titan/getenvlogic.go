package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetEnvLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetEnvLogic {
	return &GetEnvLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetEnvLogic) GetEnv(in *titan.GetEnvReq) (*titan.EnvDetailResp, error) {
	e, err := l.svcCtx.EnvModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, err
	}

	var clusterName string
	cluster, err := l.svcCtx.ClusterModel.FindOne(l.ctx, e.ClusterId)
	if err == nil && cluster != nil {
		clusterName = cluster.Name
	}

	var appCount int32
	_ = l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &appCount, "SELECT COUNT(*) FROM titan_env_app_binding WHERE env_id = ?", e.Id)

	return &titan.EnvDetailResp{
		Env: &titan.EnvItem{
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
		},
	}, nil
}
