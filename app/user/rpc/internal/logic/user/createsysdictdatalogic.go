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

type CreateSysDictDataLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateSysDictDataLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysDictDataLogic {
	return &CreateSysDictDataLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateSysDictDataLogic) CreateSysDictData(in *pb.CreateSysDictDataRequest) (*pb.IdRequest, error) {
	dictType := strings.TrimSpace(in.DictType)
	dictLabel := strings.TrimSpace(in.DictLabel)
	dictValue := strings.TrimSpace(in.DictValue)
	if len(dictType) == 0 || len(dictLabel) == 0 || len(dictValue) == 0 {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "字典类型、标签与键值不能为空")
	}

	// 检查字典类型是否存在
	typeRecord, err := l.svcCtx.SysDictTypeModel.FindOneByDictType(l.ctx, dictType)
	if err != nil || typeRecord == nil {
		return nil, xerr.NewCodeError(xerr.RecordNotFound, "所属字典类型不存在")
	}

	// 检查该字典类型下的键值是否重复
	exist, err := l.svcCtx.SysDictDataModel.FindOneByDictTypeDictValue(l.ctx, dictType, dictValue)
	if err == nil && exist != nil {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "该字典类型下键值已存在")
	}

	status := int64(in.Status)
	if status != 0 && status != 1 {
		status = 1
	}

	item := &model.SysDictData{
		DictType:  dictType,
		DictLabel: dictLabel,
		DictValue: dictValue,
		DictSort:  int64(in.DictSort),
		ListClass: in.ListClass,
		IsDefault: int64(in.IsDefault),
		Status:    status,
		Remark:    in.Remark,
	}

	res, err := l.svcCtx.SysDictDataModel.Insert(l.ctx, item)
	if err != nil {
		l.Errorf("Insert sys_dict_data err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ServerCommonError)
	}

	return &pb.IdRequest{Id: id}, nil
}
