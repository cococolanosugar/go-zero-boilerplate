package user

import (
	"context"
	"encoding/json"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetUserInfoLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取用户信息
func NewGetUserInfoLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserInfoLogic {
	return &GetUserInfoLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUserInfoLogic) GetUserInfo(req *types.UserInfoReq) (resp *types.UserInfoResp, err error) {
	userId := req.Id
	if userId <= 0 {
		if uidVal := l.ctx.Value("userId"); uidVal != nil {
			if uidJson, ok := uidVal.(json.Number); ok {
				if uidInt, err := uidJson.Int64(); err == nil {
					userId = uidInt
				}
			} else if uidInt, ok := uidVal.(int64); ok {
				userId = uidInt
			}
		}
	}
	if userId <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	rpcResp, err := l.svcCtx.UserRpc.GetUserInfo(l.ctx, &userClient.IdRequest{
		Id: userId,
	})
	if err != nil {
		return nil, err
	}

	return &types.UserInfoResp{
		Id:     rpcResp.Id,
		Name:   rpcResp.Name,
		Mobile: rpcResp.Mobile,
		Avatar: rpcResp.Avatar,
	}, nil
}
