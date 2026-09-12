// Code scaffolded by goctl. Safe to edit.
// goctl 1.10.2

package sys_dept

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysDeptLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取部门树形列表
func NewListSysDeptLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysDeptLogic {
	return &ListSysDeptLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSysDeptLogic) ListSysDept(req *types.ListSysDeptReq) (resp *types.ListSysDeptResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.ListSysDepts(l.ctx, &user.ListSysDeptsRequest{
		Keyword: req.Keyword,
		Status:  req.Status,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.SysDeptItem
	for _, item := range rpcResp.List {
		list = append(list, convertDeptItem(item))
	}

	return &types.ListSysDeptResp{
		List: list,
	}, nil
}

func convertDeptItem(item *user.SysDeptItem) *types.SysDeptItem {
	if item == nil {
		return nil
	}
	t := &types.SysDeptItem{
		Id:         item.Id,
		ParentId:   item.ParentId,
		Ancestors:  item.Ancestors,
		DeptName:   item.DeptName,
		Sort:       item.Sort,
		Leader:     item.Leader,
		Phone:      item.Phone,
		Status:     item.Status,
		CreateTime: item.CreateTime,
		UpdateTime: item.UpdateTime,
		Children:   make([]*types.SysDeptItem, 0, len(item.Children)),
	}
	for _, c := range item.Children {
		t.Children = append(t.Children, convertDeptItem(c))
	}
	return t
}

