package system

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

type AdminLoginLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 管理员账号登录
func NewAdminLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AdminLoginLogic {
	return &AdminLoginLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *AdminLoginLogic) AdminLogin(req *types.AdminLoginReq) (resp *types.AdminLoginResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.AdminLogin(l.ctx, &userClient.AdminLoginRequest{
		Account:  req.Account,
		Password: req.Password,
	})
	if err != nil {
		return nil, err
	}

	// 生成 JWT Token
	now := time.Now().Unix()
	accessExpire := l.svcCtx.Config.Auth.AccessExpire
	claims := make(jwt.MapClaims)
	claims["exp"] = now + accessExpire
	claims["iat"] = now
	claims["userId"] = rpcResp.Id

	token := jwt.New(jwt.SigningMethodHS256)
	token.Claims = claims
	tokenString, err := token.SignedString([]byte(l.svcCtx.Config.Auth.AccessSecret))
	if err != nil {
		l.Errorf("Generate JWT token err: %v", err)
		return nil, xerr.NewErrCode(xerr.TokenGenerateError)
	}

	return &types.AdminLoginResp{
		AccessToken:  tokenString,
		AccessExpire: now + accessExpire,
		RefreshAfter: now + accessExpire/2,
		UserId:       rpcResp.Id,
		Username:     rpcResp.Username,
		RealName:     rpcResp.RealName,
		Avatar:       rpcResp.Avatar,
		Roles:        rpcResp.Roles,
	}, nil
}

