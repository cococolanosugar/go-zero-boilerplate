package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

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

// UpdateProject 采用"字段显式提供才更新"语义：proto optional 指针为 nil 表示不更新。
func (l *UpdateProjectLogic) UpdateProject(in *titan.UpdateProjectReq) (*titan.CommonResp, error) {
	p, err := l.svcCtx.ProjectModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "项目")
	}

	if in.DisplayName != nil {
		p.DisplayName = *in.DisplayName
	}
	if in.Description != nil {
		p.Description = *in.Description
	}
	if in.OwnerId != nil {
		p.OwnerId = *in.OwnerId
	}
	if in.Status != nil {
		p.Status = int64(*in.Status)
	}

	if err := l.svcCtx.ProjectModel.Update(l.ctx, p); err != nil {
		return nil, xerr.NewErrMsg("更新项目失败: " + err.Error())
	}

	return &titan.CommonResp{
		Code: 200,
		Msg:  "SUCCESS",
	}, nil
}
