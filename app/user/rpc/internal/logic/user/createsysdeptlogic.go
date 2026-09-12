package userlogic

import (
	"context"
	"fmt"
	"strings"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysDeptLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateSysDeptLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysDeptLogic {
	return &CreateSysDeptLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateSysDeptLogic) CreateSysDept(in *pb.CreateSysDeptRequest) (*pb.IdRequest, error) {
	if len(strings.TrimSpace(in.DeptName)) == 0 {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "部门名称不能为空")
	}

	ancestors := "0"
	if in.ParentId > 0 {
		parent, err := l.svcCtx.SysDeptModel.FindOne(l.ctx, in.ParentId)
		if err != nil {
			if err == model.ErrNotFound {
				return nil, xerr.NewCodeError(xerr.RequestParamError, "所选上级部门不存在")
			}
			l.Errorf("SysDeptModel.FindOne parent err: %v", err)
			return nil, xerr.NewErrCode(xerr.DbError)
		}
		ancestors = fmt.Sprintf("%s,%d", parent.Ancestors, parent.Id)
	}

	data := &model.SysDept{
		ParentId:  in.ParentId,
		Ancestors: ancestors,
		DeptName:  strings.TrimSpace(in.DeptName),
		Sort:      in.Sort,
		Leader:    in.Leader,
		Phone:     in.Phone,
		Status:    in.Status,
	}

	res, err := l.svcCtx.SysDeptModel.Insert(l.ctx, data)
	if err != nil {
		l.Errorf("SysDeptModel.Insert err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	newId, err := res.LastInsertId()
	if err != nil {
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.IdRequest{Id: newId}, nil
}

