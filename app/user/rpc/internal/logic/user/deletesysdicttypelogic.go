package userlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteSysDictTypeLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteSysDictTypeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSysDictTypeLogic {
	return &DeleteSysDictTypeLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeleteSysDictTypeLogic) DeleteSysDictType(in *pb.IdRequest) (*pb.EmptyResponse, error) {
	if in.Id <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	curr, err := l.svcCtx.SysDictTypeModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewCodeError(xerr.RecordNotFound, "字典类型不存在")
		}
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// 检查该字典类型下是否包含数据项
	var count int64
	countSql := fmt.Sprintf("SELECT COUNT(*) FROM sys_dict_data WHERE dict_type = '%s'", curr.DictType)
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &count, countSql); err == nil && count > 0 {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "该字典类型下仍有数据项，请先清空或删除关联数据项")
	}

	if err := l.svcCtx.SysDictTypeModel.Delete(l.ctx, in.Id); err != nil {
		l.Errorf("Delete sys_dict_type err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}
