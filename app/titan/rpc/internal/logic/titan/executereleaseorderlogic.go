package titanlogic

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ExecuteReleaseOrderLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewExecuteReleaseOrderLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ExecuteReleaseOrderLogic {
	return &ExecuteReleaseOrderLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

type releaseServiceItem struct {
	AppId     int64  `json:"appId"`
	AppName   string `json:"appName"`
	Version   string `json:"version"`
	GitCommit string `json:"gitCommit"`
}

func (l *ExecuteReleaseOrderLogic) ExecuteReleaseOrder(in *titan.ExecuteReleaseOrderReq) (*titan.CommonResp, error) {
	if in.Id <= 0 {
		return nil, xerr.NewErrMsg("发布单ID必须大于0")
	}

	order, err := l.svcCtx.ReleaseOrderModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "发布单")
	}

	if order.Status != "APPROVED" {
		return nil, xerr.NewErrMsg("仅已审批通过的发布单允许执行，当前状态: " + order.Status)
	}

	// 1. 更新为执行中
	now := time.Now()
	order.Status = "EXECUTING"
	order.StartTime = sql.NullTime{Time: now, Valid: true}
	_ = l.svcCtx.ReleaseOrderModel.Update(l.ctx, order)

	// 2. 解析变更服务列表并执行部署流转
	var svcItems []releaseServiceItem
	if err := json.Unmarshal([]byte(order.ServicesJson), &svcItems); err == nil {
		envs, _ := l.svcCtx.EnvModel.ListByProject(l.ctx, order.ProjectId)
		var targetEnvId int64
		for _, e := range envs {
			if e.EnvCode == order.TargetEnv {
				targetEnvId = e.Id
				break
			}
		}

		if targetEnvId > 0 {
			for _, item := range svcItems {
				binding, err := l.svcCtx.EnvAppBindingModel.FindOneByEnvIdAppId(l.ctx, targetEnvId, item.AppId)
				if err == nil && binding != nil {
					binding.Status = model.BindingStatusRunning
					binding.LastDeployedTime = sql.NullTime{Time: now, Valid: true}
					_ = l.svcCtx.EnvAppBindingModel.Update(l.ctx, binding)
				}
			}
		}
	}

	// 3. 执行成功并记录终态
	endTime := time.Now()
	order.Status = "SUCCESS"
	order.EndTime = sql.NullTime{Time: endTime, Valid: true}
	if err := l.svcCtx.ReleaseOrderModel.Update(l.ctx, order); err != nil {
		return nil, xerr.NewErrMsg("更新发布单执行结果失败: " + err.Error())
	}

	return &titan.CommonResp{Code: 200, Msg: "发布单执行成功"}, nil
}
