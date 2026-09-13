package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteSysPortalNavLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteSysPortalNavLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysPortalNavLogic {
	return &DeleteSysPortalNavLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteSysPortalNavLogic) DeleteSysPortalNav(in *pb.IdRequest) (*pb.EmptyResponse, error) {
	if in.Id <= 0 {
		return nil, xerr.NewErrMsg("无效的站点ID")
	}

	if err := l.svcCtx.SysPortalNavModel.Delete(l.ctx, uint64(in.Id)); err != nil {
		l.Logger.Errorf("DeleteSysPortalNav Delete id=%d error: %v", in.Id, err)
		return nil, xerr.NewErrMsg("删除导航站点失败")
	}

	return &pb.EmptyResponse{}, nil
}
