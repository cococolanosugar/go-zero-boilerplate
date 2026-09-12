package sys_config

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysConfigLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateSysConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysConfigLogic {
	return &UpdateSysConfigLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateSysConfigLogic) UpdateSysConfig(req *types.UpdateSysConfigReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.UserRpc.UpdateSysConfig(l.ctx, &userClient.UpdateSysConfigRequest{
		Id: req.Id,
		ConfigName: req.ConfigName,
		ConfigKey: req.ConfigKey,
		ConfigValue: req.ConfigValue,
		ConfigType: req.ConfigType,
		Remark: req.Remark,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{}, nil
}
