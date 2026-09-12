package sys_notice

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysNoticeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListSysNoticeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysNoticeLogic {
	return &ListSysNoticeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysNoticeLogic) ListSysNotice(req *types.ListSysNoticeReq) (resp *types.ListSysNoticeResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysNotices(l.ctx, &userClient.ListSysNoticeRequest{
		Page:     int64(req.Page),
		PageSize: int64(req.PageSize),
		Keyword:  req.Keyword,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.SysNoticeItem
	for _, item := range rpcResp.List {
		list = append(list, &types.SysNoticeItem{
			Id: item.Id,
			NoticeTitle: item.NoticeTitle,
			NoticeType: item.NoticeType,
			NoticeContent: item.NoticeContent,
			Status: item.Status,
			CreateBy: item.CreateBy,
			Remark: item.Remark,
			CreateTime: item.CreateTime,
			UpdateTime: item.UpdateTime,
		})
	}

	return &types.ListSysNoticeResp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
