package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysConfigLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateSysConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysConfigLogic {
	return &CreateSysConfigLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateSysConfigLogic) CreateSysConfig(in *pb.CreateSysConfigRequest) (*pb.IdRequest, error) {
	item := &model.SysConfig{
		ConfigName: in.ConfigName,
		ConfigKey: in.ConfigKey,
		ConfigValue: in.ConfigValue,
		ConfigType: in.ConfigType,
		Remark: in.Remark,
	}

	res, err := l.svcCtx.SysConfigModel.Insert(l.ctx, item)
	if err != nil {
		l.Errorf("Insert sys_config err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	newId, _ := res.LastInsertId()
	return &pb.IdRequest{Id: newId}, nil
}
