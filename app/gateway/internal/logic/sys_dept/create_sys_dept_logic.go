package sys_dept

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/app/user/rpc/client/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysDeptLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 创建新部门
func NewCreateSysDeptLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysDeptLogic {
	return &CreateSysDeptLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateSysDeptLogic) CreateSysDept(req *types.CreateSysDeptReq) (resp *types.SysIdResp, err error) {
	rpcResp, err := l.svcCtx.UserRpc.CreateSysDept(l.ctx, &user.CreateSysDeptRequest{
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

	return &types.SysIdResp{
		Id: rpcResp.Id,
	}, nil
}

