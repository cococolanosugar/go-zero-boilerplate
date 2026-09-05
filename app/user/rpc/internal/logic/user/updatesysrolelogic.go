package userlogic

import (
	"context"
	"strings"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysRoleLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateSysRoleLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysRoleLogic {
	return &UpdateSysRoleLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateSysRoleLogic) UpdateSysRole(in *pb.UpdateSysRoleRequest) (*pb.EmptyResponse, error) {
	if in.Id <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	role, err := l.svcCtx.SysRoleModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewCodeError(xerr.RequestParamError, "角色不存在")
		}
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// 保护超级管理员角色
	if role.Code == "ROLE_ADMIN" || role.Code == "admin" {
		if in.Status == 0 {
			return nil, xerr.NewCodeError(xerr.RequestParamError, "超级管理员角色不可停用")
		}
	}

	newCode := strings.TrimSpace(in.Code)
	if len(newCode) > 0 && newCode != role.Code {
		exist, err := l.svcCtx.SysRoleModel.FindOneByCode(l.ctx, newCode)
		if err == nil && exist != nil && exist.Id != in.Id {
			return nil, xerr.NewCodeError(xerr.RequestParamError, "角色标识已存在")
		}
		role.Code = newCode
	}

	if len(strings.TrimSpace(in.Name)) > 0 {
		role.Name = strings.TrimSpace(in.Name)
	}
	role.Sort = int64(in.Sort)
	if in.DataScope > 0 {
		role.DataScope = int64(in.DataScope)
	}
	role.Description = in.Description
	role.Status = int64(in.Status)

	if err := l.svcCtx.SysRoleModel.Update(l.ctx, role); err != nil {
		l.Errorf("Update sys_role err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}

