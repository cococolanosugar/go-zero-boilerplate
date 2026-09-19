package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

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
		return nil, notFoundOrError(err, "环境")
	}
	// 归属校验：环境必须属于路径中的项目，不符返回记录不存在（不泄露资源内容）
	if in.ProjectId > 0 && e.ProjectId != in.ProjectId {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	var clusterName string
	cluster, err := l.svcCtx.ClusterModel.FindOne(l.ctx, e.ClusterId)
	if err == nil && cluster != nil {
		clusterName = cluster.Name
	}

	appCount, countErr := l.svcCtx.EnvAppBindingModel.CountByEnv(l.ctx, e.Id)
	if countErr != nil {
		return nil, xerr.NewErrMsg("统计环境应用数失败: " + countErr.Error())
	}

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
			AppCount:    int32(appCount),
			CreateTime:  e.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:  e.UpdateTime.Format("2006-01-02 15:04:05"),
		},
	}, nil
}
