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

type CreateSysDictTypeLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateSysDictTypeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysDictTypeLogic {
	return &CreateSysDictTypeLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateSysDictTypeLogic) CreateSysDictType(in *pb.CreateSysDictTypeRequest) (*pb.IdRequest, error) {
	dictName := strings.TrimSpace(in.DictName)
	dictType := strings.TrimSpace(in.DictType)
	if len(dictName) == 0 || len(dictType) == 0 {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "字典名称与类型标识不能为空")
	}

	// 检查字典类型标识是否已存在
	exist, err := l.svcCtx.SysDictTypeModel.FindOneByDictType(l.ctx, dictType)
	if err == nil && exist != nil {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "字典类型标识已存在")
	}

	status := int64(in.Status)
	if status != 0 && status != 1 {
		status = 1
	}

	item := &model.SysDictType{
		DictName: dictName,
		DictType: dictType,
		Status:   status,
		Remark:   in.Remark,
	}

	res, err := l.svcCtx.SysDictTypeModel.Insert(l.ctx, item)
	if err != nil {
		l.Errorf("Insert sys_dict_type err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ServerCommonError)
	}

	return &pb.IdRequest{Id: id}, nil
}
