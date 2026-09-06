package dict

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysDictTypeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateSysDictTypeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysDictTypeLogic {
	return &UpdateSysDictTypeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateSysDictTypeLogic) UpdateSysDictType(req *types.UpdateSysDictTypeReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.UserRpc.UpdateSysDictType(l.ctx, &userClient.UpdateSysDictTypeRequest{
		Id:       req.Id,
		DictName: req.DictName,
		DictType: req.DictType,
		Status:   req.Status,
		Remark:   req.Remark,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{Success: true}, nil
}
