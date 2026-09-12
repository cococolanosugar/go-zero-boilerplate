package user_notice

import (
	"context"
	"encoding/json"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type MarkAllNoticesReadLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 全部标记已读
func NewMarkAllNoticesReadLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MarkAllNoticesReadLogic {
	return &MarkAllNoticesReadLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MarkAllNoticesReadLogic) MarkAllNoticesRead(req *types.MarkAllNoticesReadReq) (resp *types.SysEmptyResp, err error) {
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

	_, err = l.svcCtx.UserRpc.MarkAllNoticesRead(l.ctx, &userClient.MarkAllNoticesReadRequest{
		UserId:     userId,
		NoticeType: req.NoticeType,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{}, nil
}

