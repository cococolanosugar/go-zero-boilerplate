package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateEnvLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateEnvLogic {
	return &UpdateEnvLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateEnvLogic) UpdateEnv(in *titan.UpdateEnvReq) (*titan.CommonResp, error) {
	e, err := l.svcCtx.EnvModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, err
	}

	if in.Name != "" {
		e.Name = in.Name
	}
	if in.ClusterId > 0 {
		e.ClusterId = in.ClusterId
	}
	if in.Namespace != "" {
		e.Namespace = in.Namespace
	}
	if in.Status != "" {
		e.Status = in.Status
	}

	if err := l.svcCtx.EnvModel.Update(l.ctx, e); err != nil {
		return nil, err
	}

	return &titan.CommonResp{
		Code: 200,
		Msg:  "SUCCESS",
	}, nil
}
