package titanlogic

import (
	"context"
	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"
	"strings"

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
	// 非空校验
	if strings.TrimSpace(in.Name) == "" {
		return nil, xerr.NewErrMsg("项目标识 (name) 不能为空")
	}
	if strings.TrimSpace(in.DisplayName) == "" {
		return nil, xerr.NewErrMsg("项目名称 (displayName) 不能为空")
	}

	res, err := l.svcCtx.ProjectModel.Insert(l.ctx, &model.TitanProject{
		Name:        in.Name,
		DisplayName: in.DisplayName,
		Description: in.Description,
		OwnerId:     in.OwnerId,
		Status:      1,
	})
	if err != nil {
		return nil, xerr.NewErrMsg("创建项目失败: " + err.Error())
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, xerr.NewErrMsg("获取项目ID失败: " + err.Error())
	}

	return &titan.CreateProjectResp{
		Id: id,
	}, nil
}
