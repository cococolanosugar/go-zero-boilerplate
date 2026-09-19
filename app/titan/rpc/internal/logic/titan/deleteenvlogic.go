package titanlogic

import (
	"context"
	"fmt"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteEnvLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeleteEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteEnvLogic {
	return &DeleteEnvLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// DeleteEnv 删除保护：存在部署绑定时拒绝删除，避免运行态孤儿数据；
// 同时校验环境确实属于路径中的项目（归属校验不符返回记录不存在）。
func (l *DeleteEnvLogic) DeleteEnv(in *titan.DeleteEnvReq) (*titan.CommonResp, error) {
	env, err := l.svcCtx.EnvModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "环境")
	}
	if in.ProjectId > 0 && env.ProjectId != in.ProjectId {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	if bindingCount, err := l.svcCtx.EnvAppBindingModel.CountByEnv(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("检查环境部署绑定失败: " + err.Error())
	} else if bindingCount > 0 {
		return nil, xerr.NewErrMsg(fmt.Sprintf("环境仍存在 %d 条应用部署绑定，请先下线部署后再删除环境", bindingCount))
	}

	if err := l.svcCtx.EnvModel.Delete(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("删除环境失败: " + err.Error())
	}

	return &titan.CommonResp{
		Code: 200,
		Msg:  "SUCCESS",
	}, nil
}
