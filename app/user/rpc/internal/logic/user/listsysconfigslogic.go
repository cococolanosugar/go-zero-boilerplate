package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSysConfigsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSysConfigsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSysConfigsLogic {
	return &ListSysConfigsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSysConfigsLogic) ListSysConfigs(in *pb.ListSysConfigRequest) (*pb.ListSysConfigResponse, error) {
	list, total, err := l.svcCtx.SysConfigModel.FindPageList(l.ctx, in.Page, in.PageSize, in.Keyword)
	if err != nil {
		l.Errorf("FindPageList sys_config err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	var pbList []*pb.SysConfigItem
	for _, item := range list {
		pbList = append(pbList, &pb.SysConfigItem{
			Id: item.Id,
			ConfigName: item.ConfigName,
			ConfigKey: item.ConfigKey,
			ConfigValue: item.ConfigValue,
			ConfigType: item.ConfigType,
			Remark: item.Remark,
			CreateTime: item.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime: item.UpdateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &pb.ListSysConfigResponse{
		Total: total,
		List:  pbList,
	}, nil
}
