package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteIntegrationLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteIntegrationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteIntegrationLogic {
	return &DeleteIntegrationLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteIntegrationLogic) DeleteIntegration(in *titan.DeleteIntegrationReq) (*titan.CommonResp, error) {
	if err := l.svcCtx.IntegrationModel.Delete(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("删除集成凭证失败: " + err.Error())
	}
	return &titan.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
