package titan

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type CompareMatrixEnvLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCompareMatrixEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CompareMatrixEnvLogic {
	return &CompareMatrixEnvLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CompareMatrixEnvLogic) CompareMatrixEnv(req *types.CompareMatrixEnvReqVO) (resp *types.CompareMatrixEnvRespVO, err error) {
	rpcResp, err := l.svcCtx.TitanRpc.CompareMatrixEnv(l.ctx, &titan.CompareMatrixEnvReq{
		ProjectId: req.ProjectId,
		AppId:     req.AppId,
		SourceEnv: req.SourceEnv,
		TargetEnv: req.TargetEnv,
	})
	if err != nil {
		return nil, err
	}

	commits := make([]types.CommitDiffItemVO, 0, len(rpcResp.Commits))
	for _, c := range rpcResp.Commits {
		commits = append(commits, types.CommitDiffItemVO{
			CommitId:   c.CommitId,
			Message:    c.Message,
			Author:     c.Author,
			CommitTime: c.CommitTime,
		})
	}

	return &types.CompareMatrixEnvRespVO{
		AppId:         rpcResp.AppId,
		AppName:       rpcResp.AppName,
		SourceEnv:     rpcResp.SourceEnv,
		SourceVersion: rpcResp.SourceVersion,
		SourceCommit:  rpcResp.SourceCommit,
		TargetEnv:     rpcResp.TargetEnv,
		TargetVersion: rpcResp.TargetVersion,
		TargetCommit:  rpcResp.TargetCommit,
		Commits:       commits,
		CanPromote:    rpcResp.CanPromote,
	}, nil
}
