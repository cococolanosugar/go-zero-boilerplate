package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysConfigLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetSysConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysConfigLogic {
	return &GetSysConfigLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetSysConfigLogic) GetSysConfig(in *pb.IdRequest) (*pb.SysConfigItem, error) {
	item, err := l.svcCtx.SysConfigModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	return &pb.SysConfigItem{
		Id: item.Id,
		ConfigName: item.ConfigName,
		ConfigKey: item.ConfigKey,
		ConfigValue: item.ConfigValue,
		ConfigType: item.ConfigType,
		Remark: item.Remark,
		CreateTime: item.CreateTime.Format("2006-01-02 15:04:05"),
		UpdateTime: item.UpdateTime.Format("2006-01-02 15:04:05"),
	}, nil
}
