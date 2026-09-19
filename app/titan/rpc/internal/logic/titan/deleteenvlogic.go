package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteEnvLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteEnvLogic {
	return &DeleteEnvLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteEnvLogic) DeleteEnv(in *titan.DeleteEnvReq) (*titan.CommonResp, error) {
	if err := l.svcCtx.EnvModel.Delete(l.ctx, in.Id); err != nil {
		return nil, err
	}

	return &titan.CommonResp{
		Code: 200,
		Msg:  "SUCCESS",
	}, nil
}
