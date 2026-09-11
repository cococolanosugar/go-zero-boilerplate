package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysPostsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysPostsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysPostsLogic {
	return &ListSysPostsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSysPostsLogic) ListSysPosts(in *pb.ListSysPostRequest) (*pb.ListSysPostResponse, error) {
	list, total, err := l.svcCtx.SysPostModel.FindPageList(l.ctx, in.Page, in.PageSize, in.Keyword)
	if err != nil {
		l.Errorf("FindPageList sys_post err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	var pbList []*pb.SysPostItem
	for _, item := range list {
		pbList = append(pbList, &pb.SysPostItem{
			Id: item.Id,
			PostCode: item.PostCode,
			PostName: item.PostName,
			PostSort: item.PostSort,
			Status: item.Status,
			Remark: item.Remark,
			CreateTime: item.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime: item.UpdateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &pb.ListSysPostResponse{
		Total: total,
		List:  pbList,
	}, nil
}
