package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysMenuTreeLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetSysMenuTreeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysMenuTreeLogic {
	return &GetSysMenuTreeLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// 菜单与接口字典：返回包含目录、菜单与按钮的完整树形结构
func (l *GetSysMenuTreeLogic) GetSysMenuTree(in *pb.EmptyRequest) (*pb.GetSysMenuTreeResponse, error) {
	var menuRows []*model.SysMenu
	querySql := "SELECT * FROM sys_menu ORDER BY sort ASC, id ASC"
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &menuRows, querySql); err != nil {
		l.Errorf("Query sys_menu tree err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	tree := buildAllMenuTree(menuRows, 0)
	return &pb.GetSysMenuTreeResponse{
		List: tree,
	}, nil
}

func buildAllMenuTree(nodes []*model.SysMenu, parentId int64) []*pb.MenuItem {
	var list []*pb.MenuItem
	for _, item := range nodes {
		if item.ParentId == parentId {
			childPb := &pb.MenuItem{
				Id:             item.Id,
				ParentId:       item.ParentId,
				Title:          item.Title,
				Type:           int32(item.Type),
				Path:           item.Path,
				Component:      item.Component,
				PermissionCode: item.PermissionCode,
				Icon:           item.Icon,
				Sort:           int32(item.Sort),
				Children:       buildAllMenuTree(nodes, item.Id),
			}
			list = append(list, childPb)
		}
	}
	return list
}

