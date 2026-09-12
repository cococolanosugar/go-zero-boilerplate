package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteSysDeptLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteSysDeptLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysDeptLogic {
	return &DeleteSysDeptLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteSysDeptLogic) DeleteSysDept(in *pb.IdRequest) (*pb.EmptyResponse, error) {
	_, err := l.svcCtx.SysDeptModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewErrCode(xerr.RecordNotFound)
		}
		l.Errorf("SysDeptModel.FindOne err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// 防线一：是否存在子部门
	hasChildren, err := l.svcCtx.SysDeptModel.CheckDeptHasChildren(l.ctx, in.Id)
	if err != nil {
		l.Errorf("CheckDeptHasChildren err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}
	if hasChildren {
		return nil, xerr.NewCodeError(xerr.Forbidden, "该部门包含下级子部门，禁止删除")
	}

	// 防线二：是否存在归属员工
	hasUsers, err := l.svcCtx.SysDeptModel.CheckDeptHasUsers(l.ctx, in.Id)
	if err != nil {
		l.Errorf("CheckDeptHasUsers err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}
	if hasUsers {
		return nil, xerr.NewCodeError(xerr.Forbidden, "该部门下仍有归属员工，禁止删除")
	}

	if err := l.svcCtx.SysDeptModel.Delete(l.ctx, in.Id); err != nil {
		l.Errorf("SysDeptModel.Delete err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}

