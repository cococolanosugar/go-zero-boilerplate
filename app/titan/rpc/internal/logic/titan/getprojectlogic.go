package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

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
		return nil, err
	}

	var appCount int32
	_ = l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &appCount, "SELECT COUNT(*) FROM titan_app WHERE project_id = ?", p.Id)

	var envCount int32
	_ = l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &envCount, "SELECT COUNT(*) FROM titan_env WHERE project_id = ?", p.Id)

	return &titan.ProjectDetailResp{
		Project: &titan.ProjectItem{
			Id:          p.Id,
			Name:        p.Name,
			DisplayName: p.DisplayName,
			Description: p.Description,
			OwnerId:     p.OwnerId,
			Status:      int32(p.Status),
			AppCount:    appCount,
			EnvCount:    envCount,
			CreateTime:  p.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:  p.UpdateTime.Format("2006-01-02 15:04:05"),
		},
	}, nil
}
