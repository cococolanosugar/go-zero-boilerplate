package sys_config

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysConfigLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListSysConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysConfigLogic {
	return &ListSysConfigLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysConfigLogic) ListSysConfig(req *types.ListSysConfigReq) (resp *types.ListSysConfigResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysConfigs(l.ctx, &userClient.ListSysConfigRequest{
		Page:     int64(req.Page),
		PageSize: int64(req.PageSize),
		Keyword:  req.Keyword,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.SysConfigItem
	for _, item := range rpcResp.List {
		list = append(list, &types.SysConfigItem{
			Id: item.Id,
			ConfigName: item.ConfigName,
			ConfigKey: item.ConfigKey,
			ConfigValue: item.ConfigValue,
			ConfigType: item.ConfigType,
			Remark: item.Remark,
			CreateTime: item.CreateTime,
			UpdateTime: item.UpdateTime,
		})
	}

	return &types.ListSysConfigResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
