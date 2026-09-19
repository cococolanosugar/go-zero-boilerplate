package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateEnvLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateEnvLogic {
	return &CreateEnvLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateEnvLogic) CreateEnv(in *titan.CreateEnvReq) (*titan.CreateEnvResp, error) {
	res, err := l.svcCtx.EnvModel.Insert(l.ctx, &model.TitanEnv{
		ProjectId: in.ProjectId,
		EnvCode:   in.EnvCode,
		Name:      in.Name,
		ClusterId: in.ClusterId,
		Namespace: in.Namespace,
		Status:    "ACTIVE",
	})
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &titan.CreateEnvResp{
		Id: id,
	}, nil
}
