package system

import (
	"context"
	"encoding/json"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/session"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListOnlineSessionsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取当前在线用户会话列表
func NewListOnlineSessionsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListOnlineSessionsLogic {
	return &ListOnlineSessionsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListOnlineSessionsLogic) ListOnlineSessions(req *types.ListOnlineSessionsReq) (resp *types.ListOnlineSessionsResp, err error) {
	if l.svcCtx.SessionMgr == nil {
		return &types.ListOnlineSessionsResp{
			Total: 0,
			List:  []*types.OnlineSessionItem{},
		}, nil
	}

	var currentUserId int64
	if uidVal := l.ctx.Value("userId"); uidVal != nil {
		if uidJson, ok := uidVal.(json.Number); ok {
			currentUserId, _ = uidJson.Int64()
		} else if uidInt, ok := uidVal.(int64); ok {
			currentUserId = uidInt
		}
	}
	currentTokenHash := session.CurrentTokenHash(l.ctx)

	total, sessions, err := l.svcCtx.SessionMgr.ListOnlineSessions(l.ctx, req.Page, req.PageSize, req.Username, req.LoginIp)
	if err != nil {
		l.Errorf("ListOnlineSessions error: %v", err)
		return nil, err
	}

	list := make([]*types.OnlineSessionItem, 0, len(sessions))
	for _, s := range sessions {
		isCurrent := false
		if currentTokenHash != "" && s.TokenHash == currentTokenHash {
			isCurrent = true
		} else if currentTokenHash == "" && s.UserId == currentUserId {
			isCurrent = true
		}

		list = append(list, &types.OnlineSessionItem{
			SessionId:     s.SessionId,
			UserId:        s.UserId,
			Username:      s.Username,
			RealName:      s.RealName,
			DeptName:      s.DeptName,
			LoginIp:       s.LoginIp,
			LoginLocation: s.LoginLocation,
			Browser:       s.Browser,
			Os:            s.Os,
			LoginTime:     s.LoginTime,
			IsCurrent:     isCurrent,
		})
	}

	return &types.ListOnlineSessionsResp{
		Total: total,
		List:  list,
	}, nil
}
