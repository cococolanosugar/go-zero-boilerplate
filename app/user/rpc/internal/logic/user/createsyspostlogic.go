package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSysPostLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateSysPostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysPostLogic {
	return &CreateSysPostLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateSysPostLogic) CreateSysPost(in *pb.CreateSysPostRequest) (*pb.IdRequest, error) {
	item := &model.SysPost{
		PostCode: in.PostCode,
		PostName: in.PostName,
		PostSort: in.PostSort,
		Status: in.Status,
		Remark: in.Remark,
	}

	res, err := l.svcCtx.SysPostModel.Insert(l.ctx, item)
	if err != nil {
		l.Errorf("Insert sys_post err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	newId, _ := res.LastInsertId()
	return &pb.IdRequest{Id: newId}, nil
}
