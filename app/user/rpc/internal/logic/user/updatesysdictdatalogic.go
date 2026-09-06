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

type UpdateSysDictDataLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateSysDictDataLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysDictDataLogic {
	return &UpdateSysDictDataLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateSysDictDataLogic) UpdateSysDictData(in *pb.UpdateSysDictDataRequest) (*pb.EmptyResponse, error) {
	if in.Id <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	dictType := strings.TrimSpace(in.DictType)
	dictLabel := strings.TrimSpace(in.DictLabel)
	dictValue := strings.TrimSpace(in.DictValue)
	if len(dictType) == 0 || len(dictLabel) == 0 || len(dictValue) == 0 {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "字典类型、标签与键值不能为空")
	}

	curr, err := l.svcCtx.SysDictDataModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewCodeError(xerr.RecordNotFound, "字典数据项不存在")
		}
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// 检查键值唯一性
	if curr.DictType != dictType || curr.DictValue != dictValue {
		exist, err := l.svcCtx.SysDictDataModel.FindOneByDictTypeDictValue(l.ctx, dictType, dictValue)
		if err == nil && exist != nil && exist.Id != in.Id {
			return nil, xerr.NewCodeError(xerr.RequestParamError, "该字典类型下键值已存在")
		}
	}

	curr.DictType = dictType
	curr.DictLabel = dictLabel
	curr.DictValue = dictValue
	curr.DictSort = int64(in.DictSort)
	curr.ListClass = in.ListClass
	curr.IsDefault = int64(in.IsDefault)
	curr.Status = int64(in.Status)
	curr.Remark = in.Remark

	if err := l.svcCtx.SysDictDataModel.Update(l.ctx, curr); err != nil {
		l.Errorf("Update sys_dict_data err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}
