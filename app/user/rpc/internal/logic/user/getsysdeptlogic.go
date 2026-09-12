package userlogic

import (
	"context"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSysDeptLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetSysDeptLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSysDeptLogic {
	return &GetSysDeptLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetSysDeptLogic) GetSysDept(in *pb.IdRequest) (*pb.SysDeptItem, error) {
	row, err := l.svcCtx.SysDeptModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, xerr.NewErrCode(xerr.RecordNotFound)
		}
		l.Errorf("SysDeptModel.FindOne error: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.SysDeptItem{
		Id:         row.Id,
		ParentId:   row.ParentId,
		Ancestors:  row.Ancestors,
		DeptName:   row.DeptName,
		Sort:       row.Sort,
		Leader:     row.Leader,
		Phone:      row.Phone,
		Status:     row.Status,
		CreateTime: row.CreateTime.Format("2006-01-02 15:04:05"),
		UpdateTime: row.UpdateTime.Format("2006-01-02 15:04:05"),
	}, nil
}

