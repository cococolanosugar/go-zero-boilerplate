package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysPortalNavLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysPortalNavLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysPortalNavLogic {
	return &ListSysPortalNavLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// Admin 后台分页查询
func (l *ListSysPortalNavLogic) ListSysPortalNav(in *pb.ListSysPortalNavRequest) (*pb.ListSysPortalNavResponse, error) {
	page := in.Page
	if page <= 0 {
		page = 1
	}
	pageSize := in.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	list, total, err := l.svcCtx.SysPortalNavModel.FindPageList(l.ctx, page, pageSize, in.Title, in.Category, in.Env, in.Status)
	if err != nil {
		l.Logger.Errorf("ListSysPortalNav FindPageList error: %v", err)
		return nil, err
	}

	var respList []*pb.PortalNavItem
	for _, item := range list {
		respList = append(respList, &pb.PortalNavItem{
			Id:          int64(item.Id),
			Title:       item.Title,
			Category:    item.Category,
			Url:         item.Url,
			Icon:        item.Icon,
			Description: item.Description,
			Tags:        item.Tags,
			Sort:        item.Sort,
			Target:      item.Target,
			Status:      item.Status,
			Env:         item.Env,
			CreateTime:  item.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdateTime:  item.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return &pb.ListSysPortalNavResponse{
		Total: total,
		List:  respList,
	}, nil
}
