package titan

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateProjectLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateProjectLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateProjectLogic {
	return &CreateProjectLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateProjectLogic) CreateProject(req *types.CreateProjectReqVO) (resp *types.CreateProjectRespVO, err error) {
	userId := req.OwnerId
	if userId <= 0 {
		userId = getUserIdFromCtx(l.ctx)
	}

	res, err := l.svcCtx.TitanRpc.CreateProject(l.ctx, &titan.CreateProjectReq{
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Description: req.Description,
		OwnerId:     userId,
	})
	if err != nil {
		return nil, err
	}

	return &types.CreateProjectRespVO{
		Id: res.Id,
	}, nil
}
