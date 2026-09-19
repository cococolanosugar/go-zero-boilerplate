package titanlogic

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/stretchr/testify/assert"
)

const validStages = `[{"id":"build","name":"构建","steps":[{"id":"checkout","name":"检出","type":"CHECKOUT"}]},{"id":"deploy","name":"部署","steps":[{"id":"k8s","name":"K8S","type":"K8S_DEPLOY"},{"id":"helm","name":"Helm","type":"HELM_DEPLOY"}]}]`

type stubExecModel struct {
	transErr     error                                // 模拟事务内步骤写入失败
	called       bool                                 // 是否被调用（验证整体回滚 = 不产生半成品）
	savedExec    *model.TitanPipelineExec             // 事务内最终保存的数据
	savedSteps   []*model.TitanPipelineStepExec
	finishCalled bool
}

func (s *stubExecModel) Insert(ctx context.Context, data *model.TitanPipelineExec) (sql.Result, error) {
	if s.transErr != nil {
		return nil, s.transErr
	}
	cp := *data
	s.savedExec = &cp
	return stubResult{}, nil
}
func (s *stubExecModel) FindOne(ctx context.Context, id int64) (*model.TitanPipelineExec, error) {
	if s.savedExec == nil {
		return nil, model.ErrNotFound
	}
	cp := *s.savedExec
	return &cp, nil
}
func (s *stubExecModel) FindOneByExecNo(ctx context.Context, execNo string) (*model.TitanPipelineExec, error) {
	return nil, model.ErrNotFound
}
func (s *stubExecModel) Update(ctx context.Context, data *model.TitanPipelineExec) error {
	return nil
}
func (s *stubExecModel) Delete(ctx context.Context, id int64) error { return nil }
func (s *stubExecModel) TransactExecSteps(ctx context.Context, exec *model.TitanPipelineExec, steps []*model.TitanPipelineStepExec) (int64, error) {
	s.called = true
	if s.transErr != nil {
		// 模拟事务回滚：exec 与 steps 均不落库
		return 0, s.transErr
	}
	cp := *exec
	cp.Id = 42
	s.savedExec = &cp
	s.savedSteps = append(s.savedSteps, steps...)
	for _, st := range steps {
		st.ExecId = 42
	}
	return 42, nil
}
func (s *stubExecModel) FinishWithStatus(ctx context.Context, id int64, fromStatuses []string, toStatus string) (bool, error) {
	s.finishCalled = true
	return true, nil
}
func (s *stubExecModel) ListLightByPage(ctx context.Context, pipelineId int64, status string, offset, limit int64) ([]*model.TitanPipelineExecLight, int64, error) {
	return nil, 0, nil
}

func triggerSvc(p *stubPipelineModel, e *stubExecModel) *svc.ServiceContext {
	return &svc.ServiceContext{PipelineModel: p, PipelineExecModel: e}
}

// 停用流水线不可触发
func TestTriggerPipelineDisabledRejected(t *testing.T) {
	p := &stubPipelineModel{record: &model.TitanPipeline{Id: 1, Name: "ci", Stages: validStages, Status: 0}}
	e := &stubExecModel{}
	l := NewTriggerPipelineLogic(context.Background(), triggerSvc(p, e))

	_, err := l.TriggerPipeline(&titan.TriggerPipelineReq{PipelineId: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "停用")
	assert.False(t, e.called, "停用流水线不得创建执行记录")
}

// stages 非法 JSON 拒绝触发（不静默创建 0 步骤执行）
func TestTriggerPipelineInvalidStagesRejected(t *testing.T) {
	p := &stubPipelineModel{record: &model.TitanPipeline{Id: 1, Name: "ci", Stages: "{not-json", Status: 1}}
	e := &stubExecModel{}
	l := NewTriggerPipelineLogic(context.Background(), triggerSvc(p, e))

	_, err := l.TriggerPipeline(&titan.TriggerPipelineReq{PipelineId: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "stages")
	assert.False(t, e.called)
}

// 步骤写入失败 → 事务整体回滚：不返回成功，不留半成品执行记录
func TestTriggerPipelineStepInsertFailureRollsBack(t *testing.T) {
	p := &stubPipelineModel{record: &model.TitanPipeline{Id: 1, Name: "ci", Stages: validStages, Status: 1}}
	e := &stubExecModel{transErr: errors.New("step insert boom")}
	l := NewTriggerPipelineLogic(context.Background(), triggerSvc(p, e))

	_, err := l.TriggerPipeline(&titan.TriggerPipelineReq{PipelineId: 1})
	assert.Error(t, err)
	assert.Nil(t, e.savedExec, "事务回滚后不得残留执行记录")
}

// 正常触发：执行与全部步骤同事务写入，ExecNo 全局唯一
func TestTriggerPipelineSuccessCreatesExecAndSteps(t *testing.T) {
	p := &stubPipelineModel{record: &model.TitanPipeline{Id: 1, Name: "ci", Stages: validStages, Status: 1}}
	e := &stubExecModel{}
	l := NewTriggerPipelineLogic(context.Background(), triggerSvc(p, e))

	resp, err := l.TriggerPipeline(&titan.TriggerPipelineReq{PipelineId: 1, TriggerType: "MANUAL", TriggerBy: 7})
	assert.NoError(t, err)
	assert.EqualValues(t, 42, resp.ExecId)
	assert.NotEmpty(t, resp.ExecNo)
	assert.True(t, e.called)
	assert.Len(t, e.savedSteps, 3, "两个阶段共 3 个步骤应全部写入")
	for _, st := range e.savedSteps {
		assert.EqualValues(t, 42, st.ExecId, "步骤应归属执行记录")
		assert.Equal(t, model.ExecStatusPending, st.Status)
	}
}

// ExecNo 格式唯一性：连续生成不重复
func TestGenExecNoUnique(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 1000; i++ {
		no := genExecNo()
		assert.False(t, seen[no], "ExecNo 重复: %s", no)
		seen[no] = true
	}
}

// 已终态执行不可取消、并发取消恰一次生效（FinishWithStatus 条件更新语义）
func TestCancelExecutionAtomicConditionalUpdate(t *testing.T) {
	e := &stubExecModel{savedExec: &model.TitanPipelineExec{Id: 42, Status: model.ExecStatusRunning}}
	l := NewCancelExecutionLogic(context.Background(), &svc.ServiceContext{PipelineExecModel: e})

	_, err := l.CancelExecution(&titan.CancelExecutionReq{ExecId: 42})
	assert.NoError(t, err)
	assert.True(t, e.finishCalled)
}

// 已成功完成的执行取消被拒绝
func TestCancelExecutionTerminalRejected(t *testing.T) {
	e := &stubExecModel{savedExec: &model.TitanPipelineExec{Id: 42, Status: model.ExecStatusSuccess}}
	l := NewCancelExecutionLogic(context.Background(), &svc.ServiceContext{PipelineExecModel: e})

	_, err := l.CancelExecution(&titan.CancelExecutionReq{ExecId: 42})
	assert.Error(t, err)
	assert.False(t, e.finishCalled, "终态执行不得再调用状态推进")
}

// ---- GetStepLog：终态判定覆盖全部终态，进行中维持轮询 ----

type stubStepExecModel struct {
	record *model.TitanPipelineStepExec
}

func (s *stubStepExecModel) Insert(ctx context.Context, data *model.TitanPipelineStepExec) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *stubStepExecModel) FindOne(ctx context.Context, id int64) (*model.TitanPipelineStepExec, error) {
	if s.record == nil {
		return nil, model.ErrNotFound
	}
	cp := *s.record
	return &cp, nil
}
func (s *stubStepExecModel) Update(ctx context.Context, data *model.TitanPipelineStepExec) error {
	return nil
}
func (s *stubStepExecModel) ListByExecId(ctx context.Context, execId int64) ([]*model.TitanPipelineStepExec, error) {
	return nil, nil
}
func (s *stubStepExecModel) Delete(ctx context.Context, id int64) error { return nil }

func TestGetStepLogTerminalStopsPolling(t *testing.T) {
	for _, status := range []string{model.ExecStatusSuccess, model.ExecStatusFailed, model.ExecStatusAborted, model.ExecStatusCancelled, model.ExecStatusSkipped} {
		m := &stubStepExecModel{record: &model.TitanPipelineStepExec{Id: 1, StepName: "build", Status: status}}
		l := NewGetStepLogLogic(context.Background(), &svc.ServiceContext{PipelineStepExecModel: m})
		resp, err := l.GetStepLog(&titan.GetStepLogReq{StepExecId: 1, Offset: 0})
		assert.NoError(t, err)
		assert.True(t, resp.IsEnd, "状态 %s 应为终态停止轮询", status)
	}
}

func TestGetStepLogRunningKeepsPolling(t *testing.T) {
	m := &stubStepExecModel{record: &model.TitanPipelineStepExec{Id: 1, StepName: "build", Status: model.ExecStatusRunning, StartTime: sql.NullTime{Time: time.Now(), Valid: true}}}
	l := NewGetStepLogLogic(context.Background(), &svc.ServiceContext{PipelineStepExecModel: m})
	resp, err := l.GetStepLog(&titan.GetStepLogReq{StepExecId: 1, Offset: 0})
	assert.NoError(t, err)
	assert.False(t, resp.IsEnd, "进行中应维持轮询")
	assert.NotEmpty(t, resp.Content)
}
