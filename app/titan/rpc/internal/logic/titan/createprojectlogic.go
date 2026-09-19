package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateProjectLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateProjectLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateProjectLogic {
	return &CreateProjectLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateProjectLogic) CreateProject(in *titan.CreateProjectReq) (*titan.CreateProjectResp, error) {
	res, err := l.svcCtx.ProjectModel.Insert(l.ctx, &model.TitanProject{
		Name:        in.Name,
		DisplayName: in.DisplayName,
		Description: in.Description,
		OwnerId:     in.OwnerId,
		Status:      1,
	})
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &titan.CreateProjectResp{
		Id: id,
	}, nil
}
