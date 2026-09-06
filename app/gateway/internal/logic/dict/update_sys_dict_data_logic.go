package dict

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysDictDataLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateSysDictDataLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysDictDataLogic {
	return &UpdateSysDictDataLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateSysDictDataLogic) UpdateSysDictData(req *types.UpdateSysDictDataReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.UserRpc.UpdateSysDictData(l.ctx, &userClient.UpdateSysDictDataRequest{
		Id:        req.Id,
		DictType:  req.DictType,
		DictLabel: req.DictLabel,
		DictValue: req.DictValue,
		DictSort:  req.DictSort,
		ListClass: req.ListClass,
		IsDefault: req.IsDefault,
		Status:    req.Status,
		Remark:    req.Remark,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{Success: true}, nil
}
