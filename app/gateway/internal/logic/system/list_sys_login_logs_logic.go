package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysLoginLogsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListSysLoginLogsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysLoginLogsLogic {
	return &ListSysLoginLogsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysLoginLogsLogic) ListSysLoginLogs(req *types.ListSysLoginLogsReq) (resp *types.ListSysLoginLogsResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysLoginLogs(l.ctx, &userClient.ListSysLoginLogsRequest{
		Page:     req.Page,
		PageSize: req.PageSize,
		Username: req.Username,
		Status:   req.Status,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.SysLoginLogItem
	for _, item := range rpcResp.List {
		list = append(list, &types.SysLoginLogItem{
			Id:        item.Id,
			Username:  item.Username,
			LoginIp:   item.LoginIp,
			Browser:   item.Browser,
			Os:        item.Os,
			Status:    item.Status,
			Msg:       item.Msg,
			LoginTime: item.LoginTime,
		})
	}

	return &types.ListSysLoginLogsResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
