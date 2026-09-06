package userlogic

import (
	"context"
	"fmt"
	"strings"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSysDictTypeLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateSysDictTypeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSysDictTypeLogic {
	return &UpdateSysDictTypeLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateSysDictTypeLogic) UpdateSysDictType(in *pb.UpdateSysDictTypeRequest) (*pb.EmptyResponse, error) {
	if in.Id <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	dictName := strings.TrimSpace(in.DictName)
	dictType := strings.TrimSpace(in.DictType)
	if len(dictName) == 0 || len(dictType) == 0 {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "字典名称与类型标识不能为空")
	}

	curr, err := l.svcCtx.SysDictTypeModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewCodeError(xerr.RecordNotFound, "字典类型不存在")
		}
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// 若更改了 dict_type，需检查唯一性并级联更新数据项
	oldType := curr.DictType
	if oldType != dictType {
		exist, err := l.svcCtx.SysDictTypeModel.FindOneByDictType(l.ctx, dictType)
		if err == nil && exist != nil && exist.Id != in.Id {
			return nil, xerr.NewCodeError(xerr.RequestParamError, "字典类型标识已存在")
		}

		// 级联更新 sys_dict_data 中的 dict_type
		updateDataSql := fmt.Sprintf("UPDATE sys_dict_data SET dict_type = '%s' WHERE dict_type = '%s'", dictType, oldType)
		if _, err := l.svcCtx.SqlConn.ExecCtx(l.ctx, updateDataSql); err != nil {
			l.Errorf("Cascade update sys_dict_data dict_type err: %v", err)
			return nil, xerr.NewErrCode(xerr.DbError)
		}
	}

	curr.DictName = dictName
	curr.DictType = dictType
	curr.Status = int64(in.Status)
	curr.Remark = in.Remark

	if err := l.svcCtx.SysDictTypeModel.Update(l.ctx, curr); err != nil {
		l.Errorf("Update sys_dict_type err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}
