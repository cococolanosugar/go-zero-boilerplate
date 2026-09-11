package system

import (
	"context"
	"strings"
	"time"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/golang-jwt/jwt/v4"
	"github.com/zeromicro/go-zero/core/logx"
)

type CasdoorLoginLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Casdoor SSO 统一身份登录
func NewCasdoorLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CasdoorLoginLogic {
	return &CasdoorLoginLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CasdoorLoginLogic) CasdoorLogin(req *types.CasdoorLoginReq) (resp *types.AdminLoginResp, err error) {
	code := strings.TrimSpace(req.Code)
	if len(code) == 0 {
		return nil, xerr.NewErrMsg("授权码 (code) 不能为空")
	}

	// 1. 初始化 Casdoor 客户端并向 Casdoor 置换 AccessToken
	casdoorConf := l.svcCtx.Config.Casdoor
	client := casdoorsdk.NewClient(
		casdoorConf.Endpoint,
		casdoorConf.ClientId,
		casdoorConf.ClientSecret,
		casdoorConf.Certificate,
		casdoorConf.OrganizationName,
		casdoorConf.ApplicationName,
	)

	token, err := client.GetOAuthToken(code, req.State)
	if err != nil {
		l.Errorf("Casdoor GetOAuthToken failed: %v", err)
		return nil, xerr.NewErrMsg("Casdoor 授权码校验失败或已失效")
	}

	// 2. 解析 JWT 提取 Casdoor 用户画像声明 (Claims)
	var claims *casdoorsdk.Claims
	if len(casdoorConf.Certificate) > 0 {
		claims, err = client.ParseJwtToken(token.AccessToken)
	} else {
		claims = &casdoorsdk.Claims{}
		var parser jwt.Parser
		_, _, err = parser.ParseUnverified(token.AccessToken, claims)
	}
	if err != nil {
		l.Errorf("Casdoor ParseJwtToken failed: %v", err)
		return nil, xerr.NewErrMsg("Casdoor 身份令牌解析异常")
	}

	// 3. 调用 User 微服务完成 JIT 增量建档与角色权限映射
	rpcResp, err := l.svcCtx.UserRpc.SyncOrCreateCasdoorUser(l.ctx, &userClient.SyncCasdoorUserRequest{
		CasdoorSub: claims.Id,
		Username:   claims.Name,
		Email:      claims.Email,
		Mobile:     claims.Phone,
		RealName:   claims.DisplayName,
		Avatar:     claims.Avatar,
	})
	if err != nil {
		return nil, err
	}

	// 4. 生成系统内部统一标准 JWT Token
	now := time.Now().Unix()
	accessExpire := l.svcCtx.Config.Auth.AccessExpire
	claimsMap := make(jwt.MapClaims)
	claimsMap["exp"] = now + accessExpire
	claimsMap["iat"] = now
	claimsMap["userId"] = rpcResp.Id

	jwtToken := jwt.New(jwt.SigningMethodHS256)
	jwtToken.Claims = claimsMap
	tokenString, err := jwtToken.SignedString([]byte(l.svcCtx.Config.Auth.AccessSecret))
	if err != nil {
		l.Errorf("Generate system JWT token err: %v", err)
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

