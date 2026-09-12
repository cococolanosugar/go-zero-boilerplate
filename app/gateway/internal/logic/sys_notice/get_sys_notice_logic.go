package sys_notice

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysNoticeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetSysNoticeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysNoticeLogic {
	return &GetSysNoticeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetSysNoticeLogic) GetSysNotice(req *types.SysIdReq) (resp *types.SysNoticeItem, err error) {
	rpcResp, err := l.svcCtx.UserRpc.GetSysNotice(l.ctx, &userClient.IdRequest{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysNoticeItem{
		Id: rpcResp.Id,
		NoticeTitle: rpcResp.NoticeTitle,
		NoticeType: rpcResp.NoticeType,
		NoticeContent: rpcResp.NoticeContent,
		Status: rpcResp.Status,
		CreateBy: rpcResp.CreateBy,
		Remark: rpcResp.Remark,
		CreateTime: rpcResp.CreateTime,
		UpdateTime: rpcResp.UpdateTime,
	}, nil
}
