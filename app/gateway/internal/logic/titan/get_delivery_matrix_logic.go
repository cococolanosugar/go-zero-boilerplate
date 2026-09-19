package titan

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetDeliveryMatrixLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetDeliveryMatrixLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetDeliveryMatrixLogic {
	return &GetDeliveryMatrixLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetDeliveryMatrixLogic) GetDeliveryMatrix(req *types.GetDeliveryMatrixReqVO) (resp *types.GetDeliveryMatrixRespVO, err error) {
	rpcResp, err := l.svcCtx.TitanRpc.GetDeliveryMatrix(l.ctx, &titan.GetDeliveryMatrixReq{
		ProjectId: req.ProjectId,
	})
	if err != nil {
		return nil, err
	}

	envHeaders := make([]types.MatrixEnvHeaderVO, 0, len(rpcResp.Envs))
	for _, env := range rpcResp.Envs {
		envHeaders = append(envHeaders, types.MatrixEnvHeaderVO{
			EnvId:       env.EnvId,
			EnvCode:     env.EnvCode,
			EnvName:     env.EnvName,
			ClusterName: env.ClusterName,
		})
	}

	serviceRows := make([]types.MatrixServiceRowVO, 0, len(rpcResp.Services))
	for _, s := range rpcResp.Services {
		cells := make([]types.MatrixCellInfoVO, 0, len(s.Cells))
		for _, c := range s.Cells {
			cells = append(cells, types.MatrixCellInfoVO{
				EnvId:          c.EnvId,
				EnvCode:        c.EnvCode,
				AppId:          c.AppId,
				ArtifactId:     c.ArtifactId,
				VersionTag:     c.VersionTag,
				GitCommit:      c.GitCommit,
				GitBranch:      c.GitBranch,
				DeployStatus:   c.DeployStatus,
				HealthStatus:   c.HealthStatus,
				ReadyReplicas:  c.ReadyReplicas,
				TotalReplicas:  c.TotalReplicas,
				LastDeployedAt: c.LastDeployedAt,
				DiffStatus:     c.DiffStatus,
			})
		}
		serviceRows = append(serviceRows, types.MatrixServiceRowVO{
			AppId:         s.AppId,
			AppName:       s.AppName,
			DisplayName:   s.DisplayName,
			RepoUrl:       s.RepoUrl,
			DefaultBranch: s.DefaultBranch,
			Cells:         cells,
		})
	}

	return &types.GetDeliveryMatrixRespVO{
		ProjectId:   rpcResp.ProjectId,
		ProjectName: rpcResp.ProjectName,
		Envs:        envHeaders,
		Services:    serviceRows,
	}, nil
}
