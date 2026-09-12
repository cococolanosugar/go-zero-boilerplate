package sys_config

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysConfigLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateSysConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysConfigLogic {
	return &CreateSysConfigLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateSysConfigLogic) CreateSysConfig(req *types.CreateSysConfigReq) (resp *types.SysIdResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.CreateSysConfig(l.ctx, &userClient.CreateSysConfigRequest{
		ConfigName: req.ConfigName,
		ConfigKey: req.ConfigKey,
		ConfigValue: req.ConfigValue,
		ConfigType: req.ConfigType,
		Remark: req.Remark,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysIdResp{
		Id: rpcResp.Id,
	}, nil
}
