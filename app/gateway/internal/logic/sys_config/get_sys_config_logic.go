package sys_config

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysConfigLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetSysConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysConfigLogic {
	return &GetSysConfigLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetSysConfigLogic) GetSysConfig(req *types.SysIdReq) (resp *types.SysConfigItem, err error) {
	rpcResp, err := l.svcCtx.UserRpc.GetSysConfig(l.ctx, &userClient.IdRequest{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysConfigItem{
		Id: rpcResp.Id,
		ConfigName: rpcResp.ConfigName,
		ConfigKey: rpcResp.ConfigKey,
		ConfigValue: rpcResp.ConfigValue,
		ConfigType: rpcResp.ConfigType,
		Remark: rpcResp.Remark,
		CreateTime: rpcResp.CreateTime,
		UpdateTime: rpcResp.UpdateTime,
	}, nil
}
