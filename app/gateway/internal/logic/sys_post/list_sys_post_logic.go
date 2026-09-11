package sys_post

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysPostLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListSysPostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysPostLogic {
	return &ListSysPostLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysPostLogic) ListSysPost(req *types.ListSysPostReq) (resp *types.ListSysPostResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysPosts(l.ctx, &userClient.ListSysPostRequest{
		Page:     int64(req.Page),
		PageSize: int64(req.PageSize),
		Keyword:  req.Keyword,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.SysPostItem
	for _, item := range rpcResp.List {
		list = append(list, &types.SysPostItem{
			Id: item.Id,
			PostCode: item.PostCode,
			PostName: item.PostName,
			PostSort: item.PostSort,
			Status: item.Status,
			Remark: item.Remark,
			CreateTime: item.CreateTime,
			UpdateTime: item.UpdateTime,
		})
	}

	return &types.ListSysPostResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
