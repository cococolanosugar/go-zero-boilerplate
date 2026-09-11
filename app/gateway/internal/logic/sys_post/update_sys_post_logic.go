package sys_post

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysPostLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateSysPostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysPostLogic {
	return &UpdateSysPostLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateSysPostLogic) UpdateSysPost(req *types.UpdateSysPostReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.UserRpc.UpdateSysPost(l.ctx, &userClient.UpdateSysPostRequest{
		Id: req.Id,
		PostCode: req.PostCode,
		PostName: req.PostName,
		PostSort: req.PostSort,
		Status: req.Status,
		Remark: req.Remark,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{}, nil
}
