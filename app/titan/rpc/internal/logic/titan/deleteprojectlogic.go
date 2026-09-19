package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteProjectLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteProjectLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteProjectLogic {
	return &DeleteProjectLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// DeleteProject 删除保护：存在子资源（应用/环境）时拒绝删除，避免孤儿数据；
// 无子资源才物理删除。级联删除策略留待软删方案统一设计。
func (l *DeleteProjectLogic) DeleteProject(in *titan.DeleteProjectReq) (*titan.CommonResp, error) {
	if _, err := l.svcCtx.ProjectModel.FindOne(l.ctx, in.Id); err != nil {
		return nil, notFoundOrError(err, "项目")
	}

	if appCount, err := l.svcCtx.AppModel.CountByProject(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("检查项目子资源失败: " + err.Error())
	} else if appCount > 0 {
		return nil, xerr.NewErrMsg(fmt.Sprintf("项目下仍存在 %d 个应用，请先删除应用后再删除项目", appCount))
	}

	if envCount, err := l.svcCtx.EnvModel.CountByProject(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("检查项目子资源失败: " + err.Error())
	} else if envCount > 0 {
		return nil, xerr.NewErrMsg(fmt.Sprintf("项目下仍存在 %d 个环境，请先删除环境后再删除项目", envCount))
	}

	if err := l.svcCtx.ProjectModel.Delete(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("删除项目失败: " + err.Error())
	}

	return &titan.CommonResp{
		Code: 200,
		Msg:  "SUCCESS",
	}, nil
}
