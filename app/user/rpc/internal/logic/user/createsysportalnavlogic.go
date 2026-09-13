package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysPortalNavLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateSysPortalNavLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysPortalNavLogic {
	return &CreateSysPortalNavLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateSysPortalNavLogic) CreateSysPortalNav(in *pb.CreateSysPortalNavRequest) (*pb.IdRequest, error) {
	if in.Title == "" || in.Url == "" {
		return nil, xerr.NewErrMsg("站点名称与目标地址不能为空")
	}

	target := in.Target
	if target == "" {
		target = "_blank"
	}

	env := in.Env
	if env == "" {
		env = "common"
	}

	res, err := l.svcCtx.SysPortalNavModel.Insert(l.ctx, &model.SysPortalNav{
		Title:       in.Title,
		Category:    in.Category,
		Url:         in.Url,
		Icon:        in.Icon,
		Description: in.Description,
		Tags:        in.Tags,
		Sort:        int64(in.Sort),
		Target:      target,
		Status:      int64(in.Status),
		Env:         env,
	})
	if err != nil {
		l.Logger.Errorf("CreateSysPortalNav Insert error: %v", err)
		return nil, xerr.NewErrMsg("创建导航站点失败")
	}

	id, _ := res.LastInsertId()
	return &pb.IdRequest{Id: id}, nil
}
