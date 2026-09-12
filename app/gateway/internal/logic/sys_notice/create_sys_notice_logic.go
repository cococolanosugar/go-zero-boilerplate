package sys_notice

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysNoticeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateSysNoticeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysNoticeLogic {
	return &CreateSysNoticeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateSysNoticeLogic) CreateSysNotice(req *types.CreateSysNoticeReq) (resp *types.SysIdResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.CreateSysNotice(l.ctx, &userClient.CreateSysNoticeRequest{
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

	return &types.SysIdResp{
		Id: rpcResp.Id,
	}, nil
}
