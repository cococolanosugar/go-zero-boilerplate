package user

import (
	"context"
	"time"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/golang-jwt/jwt/v4"
	"github.com/zeromicro/go-zero/core/logx"
)

type LoginLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 用户登录
func NewLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LoginLogic {
	return &LoginLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LoginLogic) Login(req *types.LoginReq) (resp *types.LoginResp, err error) {
	// 1. 调用 User RPC 校验密码
	loginResp, err := l.svcCtx.UserRpc.Login(l.ctx, &userClient.LoginRequest{
		Mobile:   req.Mobile,
		Password: req.Password,
	})
	if err != nil {
		return nil, err
	}

	// 2. 获取用户基础信息
	userInfo, err := l.svcCtx.UserRpc.GetUserInfo(l.ctx, &userClient.IdRequest{
		Id: loginResp.Id,
	})
	username := ""
	if err == nil && userInfo != nil {
		username = userInfo.Name
	}

	// 3. 生成 JWT Token
	now := time.Now().Unix()
	accessExpire := l.svcCtx.Config.Auth.AccessExpire
	claims := make(jwt.MapClaims)
	claims["exp"] = now + accessExpire
	claims["iat"] = now
	claims["userId"] = loginResp.Id

	token := jwt.New(jwt.SigningMethodHS256)
	token.Claims = claims
	tokenString, err := token.SignedString([]byte(l.svcCtx.Config.Auth.AccessSecret))
	if err != nil {
		l.Errorf("Generate JWT token err: %v", err)
		return nil, xerr.NewErrCode(xerr.TokenGenerateError)
	}

	return &types.LoginResp{
		AccessToken:  tokenString,
		AccessExpire: now + accessExpire,
		RefreshAfter: now + accessExpire/2,
		UserId:       loginResp.Id,
		Username:     username,
	}, nil
}

