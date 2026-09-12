package sys_notice

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysNoticeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateSysNoticeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysNoticeLogic {
	return &UpdateSysNoticeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateSysNoticeLogic) UpdateSysNotice(req *types.UpdateSysNoticeReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.UserRpc.UpdateSysNotice(l.ctx, &userClient.UpdateSysNoticeRequest{
		Id: req.Id,
		NoticeTitle: req.NoticeTitle,
		NoticeType: req.NoticeType,
		NoticeContent: req.NoticeContent,
		Status: req.Status,
		CreateBy: req.CreateBy,
		Remark: req.Remark,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{}, nil
}
