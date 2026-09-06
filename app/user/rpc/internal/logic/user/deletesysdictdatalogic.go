package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteSysDictDataLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteSysDictDataLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysDictDataLogic {
	return &DeleteSysDictDataLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteSysDictDataLogic) DeleteSysDictData(in *pb.IdRequest) (*pb.EmptyResponse, error) {
	if in.Id <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	_, err := l.svcCtx.SysDictDataModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewCodeError(xerr.RecordNotFound, "字典数据项不存在")
		}
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	if err := l.svcCtx.SysDictDataModel.Delete(l.ctx, in.Id); err != nil {
		l.Errorf("Delete sys_dict_data err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}
