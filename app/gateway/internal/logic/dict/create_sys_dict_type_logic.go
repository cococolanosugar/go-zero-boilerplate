package dict

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysDictTypeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateSysDictTypeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysDictTypeLogic {
	return &CreateSysDictTypeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateSysDictTypeLogic) CreateSysDictType(req *types.CreateSysDictTypeReq) (resp *types.SysIdResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.CreateSysDictType(l.ctx, &userClient.CreateSysDictTypeRequest{
		DictName: req.DictName,
		DictType: req.DictType,
		Status:   req.Status,
		Remark:   req.Remark,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysIdResp{
		Id: rpcResp.Id,
	}, nil
}
