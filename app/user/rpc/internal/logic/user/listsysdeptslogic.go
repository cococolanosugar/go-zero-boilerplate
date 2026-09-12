package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysDeptsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysDeptsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysDeptsLogic {
	return &ListSysDeptsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// 组织机构部门管理 (sys_dept)
func (l *ListSysDeptsLogic) ListSysDepts(in *pb.ListSysDeptsRequest) (*pb.ListSysDeptsResponse, error) {
	rows, err := l.svcCtx.SysDeptModel.FindAll(l.ctx, in.Keyword, in.Status)
	if err != nil {
		l.Errorf("SysDeptModel.FindAll error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	itemMap := make(map[int64]*pb.SysDeptItem, len(rows))
	var allItems []*pb.SysDeptItem

	for _, row := range rows {
		item := &pb.SysDeptItem{
			Id:         row.Id,
			ParentId:   row.ParentId,
			Ancestors:  row.Ancestors,
			DeptName:   row.DeptName,
			Sort:       row.Sort,
			Leader:     row.Leader,
			Phone:      row.Phone,
			Status:     row.Status,
			CreateTime: row.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime: row.UpdateTime.Format("2006-01-02 15:04:05"),
			Children:   make([]*pb.SysDeptItem, 0),
		}
		itemMap[row.Id] = item
		allItems = append(allItems, item)
	}

	var rootNodes []*pb.SysDeptItem
	for _, item := range allItems {
		if parent, ok := itemMap[item.ParentId]; ok && item.ParentId != 0 {
			parent.Children = append(parent.Children, item)
		} else {
			rootNodes = append(rootNodes, item)
		}
	}

	return &pb.ListSysDeptsResponse{
		List: rootNodes,
	}, nil
}

