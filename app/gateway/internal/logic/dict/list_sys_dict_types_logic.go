package dict

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysDictTypesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListSysDictTypesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysDictTypesLogic {
	return &ListSysDictTypesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysDictTypesLogic) ListSysDictTypes(req *types.ListSysDictTypesReq) (resp *types.ListSysDictTypesResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysDictTypes(l.ctx, &userClient.ListSysDictTypesRequest{
		Page:     req.Page,
		PageSize: req.PageSize,
		Keyword:  req.Keyword,
		Status:   req.Status,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.SysDictTypeItem
	for _, item := range rpcResp.List {
		list = append(list, &types.SysDictTypeItem{
			Id:         item.Id,
			DictName:   item.DictName,
			DictType:   item.DictType,
			Status:     item.Status,
			Remark:     item.Remark,
			CreateTime: item.CreateTime,
		})
	}

	return &types.ListSysDictTypesResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
