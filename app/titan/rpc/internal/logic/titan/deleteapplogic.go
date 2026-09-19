package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteAppLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteAppLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteAppLogic {
	return &DeleteAppLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// DeleteApp 删除保护：存在部署绑定或制品时拒绝删除，避免孤儿数据；
// 同时校验应用确实属于路径中的项目（归属校验不符返回记录不存在）。
func (l *DeleteAppLogic) DeleteApp(in *titan.DeleteAppReq) (*titan.CommonResp, error) {
	app, err := l.svcCtx.AppModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "应用")
	}
	if in.ProjectId > 0 && app.ProjectId != in.ProjectId {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	if bindingCount, err := l.svcCtx.EnvAppBindingModel.CountByApp(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("检查应用部署绑定失败: " + err.Error())
	} else if bindingCount > 0 {
		return nil, xerr.NewErrMsg(fmt.Sprintf("应用仍存在 %d 条环境部署绑定，请先下线部署后再删除应用", bindingCount))
	}

	if artifactCount, err := l.svcCtx.ArtifactModel.CountByApp(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("检查应用制品失败: " + err.Error())
	} else if artifactCount > 0 {
		return nil, xerr.NewErrMsg(fmt.Sprintf("应用仍存在 %d 个制品，请先清理制品后再删除应用", artifactCount))
	}

	if err := l.svcCtx.AppModel.Delete(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("删除应用失败: " + err.Error())
	}

	return &titan.CommonResp{
		Code: 200,
		Msg:  "SUCCESS",
	}, nil
}
