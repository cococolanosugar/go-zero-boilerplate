package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateProjectLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateProjectLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateProjectLogic {
	return &UpdateProjectLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdateProjectLogic) UpdateProject(in *titan.UpdateProjectReq) (*titan.CommonResp, error) {
	p, err := l.svcCtx.ProjectModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, err
	}

	if in.DisplayName != "" {
		p.DisplayName = in.DisplayName
	}
	if in.Description != "" {
		p.Description = in.Description
	}
	if in.OwnerId > 0 {
		p.OwnerId = in.OwnerId
	}
	if in.Status > 0 {
		p.Status = int64(in.Status)
	}

	if err := l.svcCtx.ProjectModel.Update(l.ctx, p); err != nil {
		return nil, err
	}

	return &titan.CommonResp{
		Code: 200,
		Msg:  "SUCCESS",
	}, nil
}
