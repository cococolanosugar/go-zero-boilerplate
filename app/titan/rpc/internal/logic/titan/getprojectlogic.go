package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetProjectLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetProjectLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetProjectLogic {
	return &GetProjectLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetProjectLogic) GetProject(in *titan.GetProjectReq) (*titan.ProjectDetailResp, error) {
	p, err := l.svcCtx.ProjectModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "项目")
	}

	appCount, err := l.svcCtx.AppModel.CountByProject(l.ctx, p.Id)
	if err != nil {
		return nil, xerr.NewErrMsg("统计项目应用数失败: " + err.Error())
	}
	envCount, err := l.svcCtx.EnvModel.CountByProject(l.ctx, p.Id)
	if err != nil {
		return nil, xerr.NewErrMsg("统计项目环境数失败: " + err.Error())
	}

	return &titan.ProjectDetailResp{
		Project: &titan.ProjectItem{
			Id:          p.Id,
			Name:        p.Name,
			DisplayName: p.DisplayName,
			Description: p.Description,
			OwnerId:     p.OwnerId,
			Status:      int32(p.Status),
			AppCount:    int32(appCount),
			EnvCount:    int32(envCount),
			CreateTime:  formatTime(p.CreateTime),
			UpdateTime:  formatTime(p.UpdateTime),
		},
	}, nil
}
