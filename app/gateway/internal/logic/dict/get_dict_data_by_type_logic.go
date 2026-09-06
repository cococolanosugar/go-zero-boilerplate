package dict

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetDictDataByTypeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetDictDataByTypeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetDictDataByTypeLogic {
	return &GetDictDataByTypeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetDictDataByTypeLogic) GetDictDataByType(req *types.GetDictDataByTypeReq) (resp *types.GetDictDataByTypeResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.GetDictDataByType(l.ctx, &userClient.GetDictDataByTypeRequest{
		DictType: req.DictType,
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

	return &types.GetDictDataByTypeResp{
		List: list,
	}, nil
}
