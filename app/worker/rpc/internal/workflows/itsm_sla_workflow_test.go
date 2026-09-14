package workflows

import (
	"testing"

	"go-zero-boilerplate/app/worker/contract"
	"go-zero-boilerplate/app/worker/rpc/internal/activities"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	"go.temporal.io/sdk/testsuite"
)

type UnitTestSuite struct {
	suite.Suite
	testsuite.WorkflowTestSuite
}

func TestUnitTestSuite(t *testing.T) {
	suite.Run(t, new(UnitTestSuite))
}

func (s *UnitTestSuite) Test_ItsmSlaMonitorWorkflow_Success() {
	env := s.NewTestWorkflowEnvironment()

	var a *activities.ItsmSlaActivities
	env.OnActivity(a.CheckResponseSla, mock.Anything, int64(100)).Return("RESPONSE_OK", nil)
	env.OnActivity(a.CheckResolveSla, mock.Anything, int64(100)).Return("RESOLVE_OK", nil)

	input := contract.ItsmSlaInput{
		TicketId:            100,
		TicketNo:            "INC202609140001",
		ResponseDurationSec: 10,
		ResolveDurationSec:  20,
	}

	env.ExecuteWorkflow(ItsmSlaMonitorWorkflow, input)

	s.True(env.IsWorkflowCompleted())
	s.NoError(env.GetWorkflowError())

	var result string
	s.NoError(env.GetWorkflowResult(&result))
	s.Equal("SLA_MONITORED", result)
}
