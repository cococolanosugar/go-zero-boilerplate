package titanlogic

import (
	"context"
	"database/sql"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"go-zero-boilerplate/app/itsm/rpc/itsm"
	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateReleaseOrderLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateReleaseOrderLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateReleaseOrderLogic {
	return &CreateReleaseOrderLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// 检查变更窗口期与封网规则
func isWithinChangeWindow(targetEnv string, scheduledTime time.Time) (bool, string) {
	// 针对生产环境进行封网与窗口期判定
	if strings.ToLower(targetEnv) == "prod" {
		// 示例封网规则：周五 18:00 之后至周日为生产敏感窗口
		weekday := scheduledTime.Weekday()
		hour := scheduledTime.Hour()
		if weekday == time.Friday && hour >= 18 {
			return false, "当前处于周末封网保护期 (周五 18:00 起禁止常规生产发布)"
		}
		if weekday == time.Saturday || weekday == time.Sunday {
			return false, "当前处于周末封网保护期，禁止直接发起生产发布"
		}
	}
	return true, ""
}

func (l *CreateReleaseOrderLogic) CreateReleaseOrder(in *titan.CreateReleaseOrderReq) (*titan.CreateReleaseOrderResp, error) {
	if in.ProjectId <= 0 {
		return nil, xerr.NewErrMsg("项目ID必须大于0")
	}
	if in.Title == "" {
		return nil, xerr.NewErrMsg("发布单标题不能为空")
	}
	if in.TargetEnv == "" {
		return nil, xerr.NewErrMsg("目标发布环境不能为空")
	}
	if in.ServicesJson == "" {
		return nil, xerr.NewErrMsg("发布微服务列表不能为空")
	}

	// 1. 验证项目是否存在
	project, err := l.svcCtx.ProjectModel.FindOne(l.ctx, in.ProjectId)
	if err != nil {
		return nil, notFoundOrError(err, "项目")
	}

	// 2. 检查计划发布时间与封网窗口期
	now := time.Now()
	schedTime := now
	var scheduledNullTime sql.NullTime
	if in.ScheduledTime != "" {
		if t, err := time.Parse(time.RFC3339, in.ScheduledTime); err == nil {
			schedTime = t
			scheduledNullTime = sql.NullTime{Time: t, Valid: true}
		} else if t, err := time.Parse("2006-01-02 15:04:05", in.ScheduledTime); err == nil {
			schedTime = t
			scheduledNullTime = sql.NullTime{Time: t, Valid: true}
		}
	}

	if ok, reason := isWithinChangeWindow(in.TargetEnv, schedTime); !ok {
		return nil, xerr.NewErrMsg("发布单被变更窗口期拦截: " + reason)
	}

	// 3. 生成发布单号
	orderNo := fmt.Sprintf("RO%s%04d", now.Format("20060102150405"), rand.Intn(10000))

	// 4. 判断目标环境并确定初始状态与审批卡点
	isProd := strings.ToLower(in.TargetEnv) == "prod"
	status := "APPROVED"
	if isProd {
		status = "PENDING_APPROVAL"
	}

	var itsmProcessInstId int64 = 0
	// 5. 若为生产环境且配置了 ITSM 微服务客户端，自动向工单微服务发起审批流
	if isProd && l.svcCtx.ItsmRpc != nil {
		ticketResp, err := l.svcCtx.ItsmRpc.CreateTicket(l.ctx, &itsm.CreateTicketReq{
			ProcDefId:     1, // 标准生产环境变更审批流程
			Title:         fmt.Sprintf("【生产发布审批】%s - %s", project.Name, in.Title),
			Priority:      "HIGH",
			InitiatorId:   in.ApplicantId,
			InitiatorName: in.ApplicantName,
			FormDataJson:  in.ServicesJson,
		})
		if err == nil && ticketResp != nil {
			itsmProcessInstId = ticketResp.Id
		} else if err != nil {
			logx.WithContext(l.ctx).Errorf("创建 ITSM 发布审批工单失败: %v", err)
		}
	}

	order := &model.TitanReleaseOrder{
		OrderNo:           orderNo,
		ProjectId:         in.ProjectId,
		Title:             in.Title,
		Description:       in.Description,
		TargetEnv:         in.TargetEnv,
		ServicesJson:      in.ServicesJson,
		Status:            status,
		ItsmProcessInstId: itsmProcessInstId,
		ApplicantId:       in.ApplicantId,
		ApplicantName:     in.ApplicantName,
		ScheduledTime:     scheduledNullTime,
	}

	res, err := l.svcCtx.ReleaseOrderModel.Insert(l.ctx, order)
	if err != nil {
		return nil, xerr.NewErrMsg("保存发布单失败: " + err.Error())
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, xerr.NewErrMsg("获取发布单ID失败: " + err.Error())
	}

	return &titan.CreateReleaseOrderResp{
		Id:                id,
		OrderNo:           orderNo,
		Status:            status,
		ItsmProcessInstId: itsmProcessInstId,
	}, nil
}
