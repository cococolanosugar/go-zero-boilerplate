package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteAppLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteAppLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteAppLogic {
	return &DeleteAppLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteAppLogic) DeleteApp(in *titan.DeleteAppReq) (*titan.CommonResp, error) {
	if err := l.svcCtx.AppModel.Delete(l.ctx, in.Id); err != nil {
		return nil, err
	}

	return &titan.CommonResp{
		Code: 200,
		Msg:  "SUCCESS",
	}, nil
}
