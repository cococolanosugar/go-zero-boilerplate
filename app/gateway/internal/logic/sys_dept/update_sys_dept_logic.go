package sys_dept

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysDeptLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 更新部门
func NewUpdateSysDeptLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysDeptLogic {
	return &UpdateSysDeptLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateSysDeptLogic) UpdateSysDept(req *types.UpdateSysDeptReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.UserRpc.UpdateSysDept(l.ctx, &user.UpdateSysDeptRequest{
		Id:       req.Id,
		ParentId: req.ParentId,
		DeptName: req.DeptName,
		Sort:     req.Sort,
		Leader:   req.Leader,
		Phone:    req.Phone,
		Status:   req.Status,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{}, nil
}

