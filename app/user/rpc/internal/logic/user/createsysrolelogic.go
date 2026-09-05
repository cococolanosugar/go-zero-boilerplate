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

type CreateSysRoleLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateSysRoleLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysRoleLogic {
	return &CreateSysRoleLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateSysRoleLogic) CreateSysRole(in *pb.CreateSysRoleRequest) (*pb.IdRequest, error) {
	name := strings.TrimSpace(in.Name)
	code := strings.TrimSpace(in.Code)
	if len(name) == 0 || len(code) == 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	// 检查角色标识是否重复
	exist, err := l.svcCtx.SysRoleModel.FindOneByCode(l.ctx, code)
	if err == nil && exist != nil {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "角色标识已存在")
	}

	dataScope := int64(in.DataScope)
	if dataScope <= 0 {
		dataScope = 1
	}

	role := &model.SysRole{
		Name:        name,
		Code:        code,
		Sort:        int64(in.Sort),
		DataScope:   dataScope,
		Status:      1,
		Description: in.Description,
	}

	res, err := l.svcCtx.SysRoleModel.Insert(l.ctx, role)
	if err != nil {
		l.Errorf("Insert sys_role err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	newId, err := res.LastInsertId()
	if err != nil {
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.IdRequest{Id: newId}, nil
}

