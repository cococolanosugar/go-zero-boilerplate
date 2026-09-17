package workflows

import (
	"testing"
	"time"

	"go-zero-boilerplate/app/worker/contract"
	"go-zero-boilerplate/app/worker/rpc/internal/activities"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	"go.temporal.io/sdk/testsuite"
)

type PipelineWorkflowTestSuite struct {
	suite.Suite
	testsuite.WorkflowTestSuite
}

func TestPipelineWorkflowTestSuite(t *testing.T) {
	suite.Run(t, new(PipelineWorkflowTestSuite))
}

func (s *PipelineWorkflowTestSuite) Test_TitanPipelineWorkflow_Success() {
	env := s.NewTestWorkflowEnvironment()

	var a *activities.DevopsPipelineActivities
	env.OnActivity(a.UpdatePipelineStatus, mock.Anything, int64(1), "RUNNING").Return(nil)
	env.OnActivity(a.UpdatePipelineStatus, mock.Anything, int64(1), "SUCCESS").Return(nil)
	env.OnActivity(a.ExecuteStep, mock.Anything, mock.Anything, mock.Anything).Return("Step complete", nil)

	input := contract.TitanPipelineInput{
		ExecID:     1,
		PipelineID: 10,
		ExecNo:     "TITAN-001",
		GitBranch:  "main",
		Stages: []contract.PipelineStageInput{
			{
				StageID:   "build-stage",
				StageName: "编译打包",
				Steps: []contract.PipelineStepInput{
					{
						StepID:     "step-git",
						StepName:   "Git Clone",
						StepType:   "GIT_CHECKOUT",
						StepExecID: 101,
					},
					{
						StepID:     "step-build",
						StepName:   "Kaniko Build",
						StepType:   "KANIKO_BUILD",
						StepExecID: 102,
					},
				},
			},
		},
		Params: map[string]string{
			"git_branch": "main",
			"image_tag":  "v1.0.0",
		},
	}

	env.ExecuteWorkflow(TitanPipelineWorkflow, input)

	s.True(env.IsWorkflowCompleted())
	s.NoError(env.GetWorkflowError())

	var result string
	s.NoError(env.GetWorkflowResult(&result))
	s.Equal("SUCCESS", result)
}

func (s *PipelineWorkflowTestSuite) Test_TitanPipelineWorkflow_WithApproval() {
	env := s.NewTestWorkflowEnvironment()

	var a *activities.DevopsPipelineActivities
	env.OnActivity(a.UpdatePipelineStatus, mock.Anything, int64(2), "RUNNING").Return(nil)
	env.OnActivity(a.UpdatePipelineStatus, mock.Anything, int64(2), "SUCCESS").Return(nil)
	env.OnActivity(a.UpdateStepStatus, mock.Anything, int64(201), "WAITING_APPROVAL", "").Return(nil)
	env.OnActivity(a.UpdateStepStatus, mock.Anything, int64(201), "SUCCESS", "").Return(nil)

	input := contract.TitanPipelineInput{
		ExecID:     2,
		PipelineID: 20,
		ExecNo:     "TITAN-002",
		Stages: []contract.PipelineStageInput{
			{
				StageID:   "deploy-stage",
				StageName: "生产部署",
				Steps: []contract.PipelineStepInput{
					{
						StepID:     "prod-approval",
						StepName:   "生产环境审批卡点",
						StepType:   "APPROVAL",
						StepExecID: 201,
					},
				},
			},
		},
	}

	// 注册信号延迟发送
	env.RegisterDelayedCallback(func() {
		env.SignalWorkflow(contract.SignalApproveStep, contract.StepApprovalSignal{
			StepID:   "prod-approval",
			Approved: true,
			Comment:  "Approved by Tech Lead",
			UserID:   1,
		})
	}, 1*time.Second)

	env.ExecuteWorkflow(TitanPipelineWorkflow, input)

	s.True(env.IsWorkflowCompleted())
	s.NoError(env.GetWorkflowError())

	var result string
	s.NoError(env.GetWorkflowResult(&result))
	s.Equal("SUCCESS", result)
}
