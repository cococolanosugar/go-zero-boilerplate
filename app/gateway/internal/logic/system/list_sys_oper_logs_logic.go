package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysOperLogsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListSysOperLogsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysOperLogsLogic {
	return &ListSysOperLogsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysOperLogsLogic) ListSysOperLogs(req *types.ListSysOperLogsReq) (resp *types.ListSysOperLogsResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysOperLogs(l.ctx, &userClient.ListSysOperLogsRequest{
		Page:     req.Page,
		PageSize: req.PageSize,
		OperName: req.OperName,
		Title:    req.Title,
		Status:   req.Status,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.SysOperLogItem
	for _, item := range rpcResp.List {
		list = append(list, &types.SysOperLogItem{
			Id:         item.Id,
			Title:      item.Title,
			OperName:   item.OperName,
			OperUrl:    item.OperUrl,
			OperMethod: item.OperMethod,
			OperIp:     item.OperIp,
			Status:     item.Status,
			ErrorMsg:   item.ErrorMsg,
			CostTime:   item.CostTime,
			CreateTime: item.CreateTime,
		})
	}

	return &types.ListSysOperLogsResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
