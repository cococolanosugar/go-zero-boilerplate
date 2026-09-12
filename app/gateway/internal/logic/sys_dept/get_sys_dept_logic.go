package sys_dept

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysDeptLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取部门详情
func NewGetSysDeptLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysDeptLogic {
	return &GetSysDeptLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetSysDeptLogic) GetSysDept(req *types.SysIdReq) (resp *types.SysDeptItem, err error) {
	item, err := l.svcCtx.UserRpc.GetSysDept(l.ctx, &user.IdRequest{Id: req.Id})
	if err != nil {
		return nil, err
	}

	return &types.SysDeptItem{
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
	}, nil
}

