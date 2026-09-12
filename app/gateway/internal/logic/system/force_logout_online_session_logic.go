package system

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/session"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ForceLogoutOnlineSessionLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 强退指定在线用户会话
func NewForceLogoutOnlineSessionLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ForceLogoutOnlineSessionLogic {
	return &ForceLogoutOnlineSessionLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ForceLogoutOnlineSessionLogic) ForceLogoutOnlineSession(req *types.ForceLogoutReq) (resp *types.SysEmptyResp, err error) {
	if l.svcCtx.SessionMgr == nil {
		return &types.SysEmptyResp{}, nil
	}

	sess, err := l.svcCtx.SessionMgr.GetSession(l.ctx, req.SessionId)
	if err != nil {
		l.Errorf("GetSession %s error: %v", req.SessionId, err)
		return nil, err
	}
	if sess == nil {
		// 会话已过期或不存在
		return &types.SysEmptyResp{}, nil
	}

	currentTokenHash := session.CurrentTokenHash(l.ctx)
	if currentTokenHash != "" && sess.TokenHash == currentTokenHash {
		return nil, xerr.NewErrMsg("不能强退当前正在操作的自身登录会话")
	}

	if err := l.svcCtx.SessionMgr.ForceLogout(l.ctx, req.SessionId); err != nil {
		l.Errorf("ForceLogout %s error: %v", req.SessionId, err)
		return nil, err
	}

	return &types.SysEmptyResp{}, nil
}
