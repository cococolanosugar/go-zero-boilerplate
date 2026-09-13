package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetPortalNavListLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetPortalNavListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetPortalNavListLogic {
	return &GetPortalNavListLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// 门户网址导航站点管理 (sys_portal_nav) - 门户只读列表
func (l *GetPortalNavListLogic) GetPortalNavList(in *pb.GetPortalNavListRequest) (*pb.GetPortalNavListResponse, error) {
	status := int64(1)
	if in.Status != 0 {
		status = in.Status
	}

	list, err := l.svcCtx.SysPortalNavModel.FindListByStatus(l.ctx, status, in.Env)
	if err != nil {
		l.Logger.Errorf("GetPortalNavList FindListByStatus error: %v", err)
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

	return &pb.GetPortalNavListResponse{
		List: respList,
	}, nil
}
