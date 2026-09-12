package system

import (
	"context"
	"encoding/json"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ChangePersonalPasswordLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 修改当前登录员工密码
func NewChangePersonalPasswordLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ChangePersonalPasswordLogic {
	return &ChangePersonalPasswordLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ChangePersonalPasswordLogic) ChangePersonalPassword(req *types.ChangePersonalPasswordReq) (resp *types.SysEmptyResp, err error) {
	var userId int64
	if uidVal := l.ctx.Value("userId"); uidVal != nil {
		if uidJson, ok := uidVal.(json.Number); ok {
			if uidInt, err := uidJson.Int64(); err == nil {
				userId = uidInt
			}
		} else if uidInt, ok := uidVal.(int64); ok {
			userId = uidInt
		}
	}
	if userId <= 0 {
		return nil, xerr.NewErrCode(xerr.TokenExpireError)
	}

	_, err = l.svcCtx.UserRpc.ChangePersonalPassword(l.ctx, &userClient.ChangePersonalPasswordRequest{
		UserId:      userId,
		OldPassword: req.OldPassword,
		NewPassword: req.NewPassword,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{
		Success: true,
	}, nil
}
