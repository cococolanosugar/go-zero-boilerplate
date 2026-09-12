package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysNoticesLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysNoticesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysNoticesLogic {
	return &ListSysNoticesLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSysNoticesLogic) ListSysNotices(in *pb.ListSysNoticeRequest) (*pb.ListSysNoticeResponse, error) {
	list, total, err := l.svcCtx.SysNoticeModel.FindPageList(l.ctx, in.Page, in.PageSize, in.Keyword)
	if err != nil {
		l.Errorf("FindPageList sys_notice err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	var pbList []*pb.SysNoticeItem
	for _, item := range list {
		pbList = append(pbList, &pb.SysNoticeItem{
			Id: item.Id,
			NoticeTitle: item.NoticeTitle,
			NoticeType: item.NoticeType,
			NoticeContent: item.NoticeContent,
			Status: item.Status,
			CreateBy: item.CreateBy,
			Remark: item.Remark,
			CreateTime: item.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime: item.UpdateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &pb.ListSysNoticeResponse{
		Total: total,
		List:  pbList,
	}, nil
}
