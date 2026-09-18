package titanlogic

import (
	"context"

	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeletePipelineLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDeletePipelineLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeletePipelineLogic {
	return &DeletePipelineLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *DeletePipelineLogic) DeletePipeline(in *titan.DeletePipelineReq) (*titan.CommonResp, error) {
	if err := l.svcCtx.PipelineModel.Delete(l.ctx, in.Id); err != nil {
		return nil, xerr.NewErrMsg("删除流水线失败: " + err.Error())
	}
	return &titan.CommonResp{Code: 200, Msg: "SUCCESS"}, nil
}
