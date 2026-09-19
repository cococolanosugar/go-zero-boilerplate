package titanlogic

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type TriggerPipelineLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewTriggerPipelineLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TriggerPipelineLogic {
	return &TriggerPipelineLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

type StageDef struct {
	ID    string    `json:"id"`
	Name  string    `json:"name"`
	Steps []StepDef `json:"steps"`
}

type StepDef struct {
	ID       string            `json:"id"`
	Name     string            `json:"name"`
	StepType string            `json:"type"` // GIT_CHECKOUT, KANIKO_BUILD, JENKINS_JOB, K8S_DEPLOY, HELM_DEPLOY, APPROVAL
	Config   map[string]string `json:"config"`
}

// genExecNo 生成唯一执行编号：时间戳 + UUID 短段，消除秒级时间戳+4 位随机数的高并发碰撞
func genExecNo() string {
	short := uuid.NewString()
	if len(short) > 8 {
		short = short[:8]
	}
	return fmt.Sprintf("TITAN-%s-%s", time.Now().Format("20060102150405"), short)
}

func (l *TriggerPipelineLogic) TriggerPipeline(in *titan.TriggerPipelineReq) (*titan.TriggerPipelineResp, error) {
	p, err := l.svcCtx.PipelineModel.FindOne(l.ctx, in.PipelineId)
	if err != nil {
		return nil, notFoundOrError(err, "流水线")
	}
	if p.Status != model.CommonStatusEnabled {
		return nil, xerr.NewErrMsg("流水线已停用，无法触发")
	}

	// stages 必须是合法 JSON，否则拒绝触发（不静默创建 0 步骤执行）
	var stages []StageDef
	if err := json.Unmarshal([]byte(p.Stages), &stages); err != nil {
		return nil, xerr.NewErrMsg("流水线阶段定义 (stages) 不是合法 JSON，无法触发: " + err.Error())
	}

	gitBranch := in.GitBranch
	if gitBranch == "" {
		gitBranch = p.GitBranch
	}
	if gitBranch == "" {
		gitBranch = "master"
	}

	now := time.Now()
	execNo := genExecNo()
	workflowId := fmt.Sprintf("wf-%s", uuid.NewString())

	runtimeParams := in.RuntimeParams
	if runtimeParams == "" {
		runtimeParams = "{}"
	}

	// 执行记录与全部步骤在同一事务内写入：要么完整创建，要么整体回滚
	nowNull := sql.NullTime{Time: now, Valid: true}
	steps := make([]*model.TitanPipelineStepExec, 0, len(stages))
	for _, stage := range stages {
		for _, step := range stage.Steps {
			steps = append(steps, &model.TitanPipelineStepExec{
				ExecId:    0, // 事务内在 execId 确认后统一回填
				StageId:   stage.ID,
				StepId:    step.ID,
				StepName:  step.Name,
				StepType:  step.StepType,
				Status:    model.ExecStatusPending,
				LogPath:   fmt.Sprintf("/logs/titan/%s/%s.log", execNo, step.ID),
				ErrorMsg:  "",
				StartTime: nowNull,
			})
		}
	}

	execId, txErr := l.svcCtx.PipelineExecModel.TransactExecSteps(l.ctx, &model.TitanPipelineExec{
		PipelineId:    p.Id,
		PipelineName:  p.DisplayName,
		ExecNo:        execNo,
		TriggerType:   in.TriggerType,
		TriggerBy:     in.TriggerBy,
		GitBranch:     gitBranch,
		GitCommit:     in.GitCommit,
		RuntimeParams: runtimeParams,
		Status:        model.ExecStatusRunning,
		WorkflowId:    workflowId,
		StartTime:     nowNull,
		Artifacts:     "[]",
	}, steps)
	if txErr != nil {
		return nil, xerr.NewErrMsg("创建执行记录失败: " + txErr.Error())
	}

	l.Infof("pipeline %s triggered by user %d, execNo=%s, steps=%d", p.Name, in.TriggerBy, execNo, len(steps))

	return &titan.TriggerPipelineResp{
		ExecId: execId,
		ExecNo: execNo,
	}, nil
}
