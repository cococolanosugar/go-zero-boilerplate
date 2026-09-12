package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysConfigLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateSysConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysConfigLogic {
	return &UpdateSysConfigLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateSysConfigLogic) UpdateSysConfig(in *pb.UpdateSysConfigRequest) (*pb.EmptyResponse, error) {
	item, err := l.svcCtx.SysConfigModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	item.ConfigName = in.ConfigName
	item.ConfigKey = in.ConfigKey
	item.ConfigValue = in.ConfigValue
	item.ConfigType = in.ConfigType
	item.Remark = in.Remark

	err = l.svcCtx.SysConfigModel.Update(l.ctx, item)
	if err != nil {
		l.Errorf("Update sys_config err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}
