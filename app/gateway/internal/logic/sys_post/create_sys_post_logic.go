package sys_post

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysPostLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateSysPostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysPostLogic {
	return &CreateSysPostLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateSysPostLogic) CreateSysPost(req *types.CreateSysPostReq) (resp *types.SysIdResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.CreateSysPost(l.ctx, &userClient.CreateSysPostRequest{
		PostCode: req.PostCode,
		PostName: req.PostName,
		PostSort: req.PostSort,
		Status: req.Status,
		Remark: req.Remark,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysIdResp{
		Id: rpcResp.Id,
	}, nil
}
