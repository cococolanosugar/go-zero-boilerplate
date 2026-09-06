package dict

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysDictDataLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListSysDictDataLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysDictDataLogic {
	return &ListSysDictDataLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysDictDataLogic) ListSysDictData(req *types.ListSysDictDataReq) (resp *types.ListSysDictDataResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysDictData(l.ctx, &userClient.ListSysDictDataRequest{
		Page:     req.Page,
		PageSize: req.PageSize,
		DictType: req.DictType,
		Keyword:  req.Keyword,
		Status:   req.Status,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.SysDictDataItem
	for _, item := range rpcResp.List {
		list = append(list, &types.SysDictDataItem{
			Id:         item.Id,
			DictType:   item.DictType,
			DictLabel:  item.DictLabel,
			DictValue:  item.DictValue,
			DictSort:   item.DictSort,
			ListClass:  item.ListClass,
			IsDefault:  item.IsDefault,
			Status:     item.Status,
			Remark:     item.Remark,
			CreateTime: item.CreateTime,
		})
	}

	return &types.ListSysDictDataResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
