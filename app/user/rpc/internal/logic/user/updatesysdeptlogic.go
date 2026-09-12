package userlogic

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysDeptLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateSysDeptLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysDeptLogic {
	return &UpdateSysDeptLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateSysDeptLogic) UpdateSysDept(in *pb.UpdateSysDeptRequest) (*pb.EmptyResponse, error) {
	dept, err := l.svcCtx.SysDeptModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewErrCode(xerr.RecordNotFound)
		}
		l.Errorf("SysDeptModel.FindOne err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	if in.ParentId == in.Id {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "上级部门不能选择当前部门自身")
	}

	newAncestors := "0"
	if in.ParentId > 0 {
		newParent, err := l.svcCtx.SysDeptModel.FindOne(l.ctx, in.ParentId)
		if err != nil {
			if err == model.ErrNotFound {
				return nil, xerr.NewCodeError(xerr.RequestParamError, "所选上级部门不存在")
			}
			l.Errorf("SysDeptModel.FindOne parent err: %v", err)
			return nil, xerr.NewErrCode(xerr.DbError)
		}

		// 循环依赖检查：上级部门不能是当前部门的子孙部门
		ancestorsSlice := strings.Split(newParent.Ancestors, ",")
		targetIdStr := strconv.FormatInt(in.Id, 10)
		for _, a := range ancestorsSlice {
			if a == targetIdStr {
				return nil, xerr.NewCodeError(xerr.RequestParamError, "上级部门不能是自身的下级子部门，防止死锁环路")
			}
		}

		newAncestors = fmt.Sprintf("%s,%d", newParent.Ancestors, newParent.Id)
	}

	oldAncestors := dept.Ancestors
	dept.ParentId = in.ParentId
	dept.Ancestors = newAncestors
	dept.DeptName = strings.TrimSpace(in.DeptName)
	dept.Sort = in.Sort
	dept.Leader = in.Leader
	dept.Phone = in.Phone
	dept.Status = in.Status

	if err := l.svcCtx.SysDeptModel.UpdateDeptWithChildren(l.ctx, dept, oldAncestors, newAncestors); err != nil {
		l.Errorf("SysDeptModel.UpdateDeptWithChildren err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}

