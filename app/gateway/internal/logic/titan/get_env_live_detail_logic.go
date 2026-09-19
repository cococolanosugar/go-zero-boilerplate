package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetEnvLiveDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetEnvLiveDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetEnvLiveDetailLogic {
	return &GetEnvLiveDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetEnvLiveDetailLogic) GetEnvLiveDetail(req *types.GetEnvLiveDetailReqVO) (resp *types.GetEnvLiveDetailRespVO, err error) {
	res, err := l.svcCtx.TitanRpc.GetEnvLiveDetail(l.ctx, &titan.GetEnvLiveDetailReq{
		EnvId: req.Id,
	})
	if err != nil {
		return nil, err
	}

	apps := make([]types.EnvAppLiveVO, 0, len(res.Apps))
	for _, a := range res.Apps {
		apps = append(apps, types.EnvAppLiveVO{
			AppId:             a.AppId,
			AppName:           a.AppName,
			DisplayName:       a.DisplayName,
			CurrentArtifactId: a.CurrentArtifactId,
			ImageTag:          a.ImageTag,
			ImageUrl:          a.ImageUrl,
			GitCommit:         a.GitCommit,
			ReadyReplicas:     a.ReadyReplicas,
			TotalReplicas:     a.TotalReplicas,
			Status:            a.Status,
			LastDeployedTime:  a.LastDeployedTime,
			Pods:              a.Pods,
		})
	}

	return &types.GetEnvLiveDetailRespVO{
		EnvId:       res.EnvId,
		EnvCode:     res.EnvCode,
		EnvName:     res.EnvName,
		ClusterName: res.ClusterName,
		Namespace:   res.Namespace,
		Apps:        apps,
	}, nil
}
