package titanlogic

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math/rand"
	"time"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/pkg/xerr"

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

func (l *TriggerPipelineLogic) TriggerPipeline(in *titan.TriggerPipelineReq) (*titan.TriggerPipelineResp, error) {
	p, err := l.svcCtx.PipelineModel.FindOne(l.ctx, in.PipelineId)
	if err != nil {
		return nil, xerr.NewErrMsg("目标流水线不存在")
	}

	gitBranch := in.GitBranch
	if gitBranch == "" {
		gitBranch = p.GitBranch
	}

	now := time.Now()
	execNo := fmt.Sprintf("TITAN-%s-%04d", now.Format("20060102150405"), rand.Intn(10000))
	workflowId := fmt.Sprintf("wf-%s", execNo)

	runtimeParams := in.RuntimeParams
	if runtimeParams == "" {
		runtimeParams = "{}"
	}

	res, err := l.svcCtx.PipelineExecModel.Insert(l.ctx, &model.TitanPipelineExec{
		PipelineId:    p.Id,
		PipelineName:  p.DisplayName,
		ExecNo:        execNo,
		TriggerType:   in.TriggerType,
		TriggerBy:     in.TriggerBy,
		GitBranch:     gitBranch,
		GitCommit:     in.GitCommit,
		RuntimeParams: runtimeParams,
		Status:        "RUNNING",
		WorkflowId:    workflowId,
		StartTime:     sql.NullTime{Time: now, Valid: true},
		Artifacts:     "[]",
	})
	if err != nil {
		return nil, xerr.NewErrMsg("创建执行记录失败: " + err.Error())
	}

	execId, _ := res.LastInsertId()

	// 解析 stages 并批量插入 step_exec
	var stages []StageDef
	_ = json.Unmarshal([]byte(p.Stages), &stages)

	for _, stage := range stages {
		for _, step := range stage.Steps {
			_, _ = l.svcCtx.PipelineStepExecModel.Insert(l.ctx, &model.TitanPipelineStepExec{
				ExecId:    execId,
				StageId:   stage.ID,
				StepId:    step.ID,
				StepName:  step.Name,
				StepType:  step.StepType,
				Status:    "PENDING",
				LogPath:   fmt.Sprintf("/logs/titan/%s/%s.log", execNo, step.ID),
				ErrorMsg:  "",
				StartTime: sql.NullTime{Time: now, Valid: true},
			})
		}
	}

	return &titan.TriggerPipelineResp{
		ExecId: execId,
		ExecNo: execNo,
	}, nil
}
