package dict

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysDictDataLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateSysDictDataLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysDictDataLogic {
	return &CreateSysDictDataLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateSysDictDataLogic) CreateSysDictData(req *types.CreateSysDictDataReq) (resp *types.SysIdResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.CreateSysDictData(l.ctx, &userClient.CreateSysDictDataRequest{
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

	return &types.SysIdResp{
		Id: rpcResp.Id,
	}, nil
}
