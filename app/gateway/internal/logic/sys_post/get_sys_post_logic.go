package sys_post

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysPostLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetSysPostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysPostLogic {
	return &GetSysPostLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetSysPostLogic) GetSysPost(req *types.SysIdReq) (resp *types.SysPostItem, err error) {
	rpcResp, err := l.svcCtx.UserRpc.GetSysPost(l.ctx, &userClient.IdRequest{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysPostItem{
		Id: rpcResp.Id,
		PostCode: rpcResp.PostCode,
		PostName: rpcResp.PostName,
		PostSort: rpcResp.PostSort,
		Status: rpcResp.Status,
		Remark: rpcResp.Remark,
		CreateTime: rpcResp.CreateTime,
		UpdateTime: rpcResp.UpdateTime,
	}, nil
}
