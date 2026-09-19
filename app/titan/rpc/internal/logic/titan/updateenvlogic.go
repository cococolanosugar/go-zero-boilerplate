package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateEnvLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateEnvLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateEnvLogic {
	return &UpdateEnvLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// UpdateEnv 采用"字段显式提供才更新"语义：proto optional 指针为 nil 表示不更新。
func (l *UpdateEnvLogic) UpdateEnv(in *titan.UpdateEnvReq) (*titan.CommonResp, error) {
	e, err := l.svcCtx.EnvModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "环境")
	}

	if in.Name != nil {
		e.Name = *in.Name
	}
	if in.ClusterId != nil {
		e.ClusterId = *in.ClusterId
	}
	if in.Namespace != nil {
		e.Namespace = *in.Namespace
	}
	if in.Status != nil {
		e.Status = *in.Status
	}

	if err := l.svcCtx.EnvModel.Update(l.ctx, e); err != nil {
		return nil, xerr.NewErrMsg("更新环境失败: " + err.Error())
	}

	return &titan.CommonResp{
		Code: 200,
		Msg:  "SUCCESS",
	}, nil
}
