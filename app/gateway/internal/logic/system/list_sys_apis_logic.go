package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysApisLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取系统 API 字典列表
func NewListSysApisLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysApisLogic {
	return &ListSysApisLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysApisLogic) ListSysApis() (resp *types.ListSysApisResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysApis(l.ctx, &userClient.EmptyRequest{})
	if err != nil {
		return nil, err
	}

	var list []*types.SysApiItem
	for _, a := range rpcResp.List {
		list = append(list, &types.SysApiItem{
			Id:         a.Id,
			ApiGroup:   a.ApiGroup,
			Title:      a.Title,
			Path:       a.Path,
			Method:     a.Method,
			IsAutoSync: a.IsAutoSync,
		})
	}

	return &types.ListSysApisResp{
		List: list,
	}, nil
}

