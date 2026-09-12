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

type GetMyNoticeFeedLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取当前员工个人通知流与未读数
func NewGetMyNoticeFeedLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMyNoticeFeedLogic {
	return &GetMyNoticeFeedLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMyNoticeFeedLogic) GetMyNoticeFeed(req *types.GetMyNoticeFeedReq) (resp *types.GetMyNoticeFeedResp, err error) {
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

	rpcResp, err := l.svcCtx.UserRpc.GetMyNoticeFeed(l.ctx, &userClient.GetMyNoticeFeedRequest{
		UserId: userId,
		Limit:  req.Limit,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.NoticeFeedItem
	for _, item := range rpcResp.List {
		list = append(list, &types.NoticeFeedItem{
			Id:            item.Id,
			NoticeTitle:   item.NoticeTitle,
			NoticeType:    item.NoticeType,
			NoticeContent: item.NoticeContent,
			Status:        item.Status,
			CreateBy:      item.CreateBy,
			Remark:        item.Remark,
			CreateTime:    item.CreateTime,
			UpdateTime:    item.UpdateTime,
			IsRead:        item.IsRead,
		})
	}

	return &types.GetMyNoticeFeedResp{
		TotalUnread: rpcResp.TotalUnread,
		List:        list,
	}, nil
}

