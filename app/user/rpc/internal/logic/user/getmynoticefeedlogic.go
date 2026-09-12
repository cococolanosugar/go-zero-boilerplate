package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetMyNoticeFeedLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetMyNoticeFeedLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMyNoticeFeedLogic {
	return &GetMyNoticeFeedLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// 员工通知中心
func (l *GetMyNoticeFeedLogic) GetMyNoticeFeed(in *pb.GetMyNoticeFeedRequest) (*pb.GetMyNoticeFeedResponse, error) {
	items, unreadCount, err := l.svcCtx.SysNoticeModel.GetMyNoticeFeed(l.ctx, in.UserId, in.Limit)
	if err != nil {
		return nil, xerr.NewErrMsg("获取通知列表失败: " + err.Error())
	}

	var pbList []*pb.NoticeFeedItem
	for _, item := range items {
		pbList = append(pbList, &pb.NoticeFeedItem{
			Id:            item.Id,
			NoticeTitle:   item.NoticeTitle,
			NoticeType:    item.NoticeType,
			NoticeContent: item.NoticeContent,
			Status:        item.Status,
			CreateBy:      item.CreateBy,
			Remark:        item.Remark,
			CreateTime:    item.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:    item.UpdateTime.Format("2006-01-02 15:04:05"),
			IsRead:        item.IsRead == 1,
		})
	}

	return &pb.GetMyNoticeFeedResponse{
		TotalUnread: unreadCount,
		List:        pbList,
	}, nil
}
