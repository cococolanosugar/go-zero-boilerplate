package model

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ TitanPipelineExecModel = (*customTitanPipelineExecModel)(nil)

type (
	// TitanPipelineExecModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTitanPipelineExecModel.
	TitanPipelineExecModel interface {
		titanPipelineExecModel
		// TransactExecSteps 在同一事务内创建执行记录与全部步骤记录，任一失败整体回滚。
		// 返回执行记录 ID。消除"半途失败留下僵尸 RUNNING 执行"的不一致窗口。
		TransactExecSteps(ctx context.Context, exec *TitanPipelineExec, steps []*TitanPipelineStepExec) (int64, error)
		// FinishWithStatus 以前置状态条件的原子更新推进执行终态（并发取消/状态推进互不覆盖）
		FinishWithStatus(ctx context.Context, id int64, fromStatuses []string, toStatus string) (bool, error)
		// ListLightByPage 分页查询执行记录（轻量列：不含 runtime_params/artifacts 大字段）
		ListLightByPage(ctx context.Context, pipelineId int64, status string, offset, limit int64) ([]*TitanPipelineExecLight, int64, error)
	}

	customTitanPipelineExecModel struct {
		*defaultTitanPipelineExecModel
	}
)

// NewTitanPipelineExecModel returns a model for the database table.
func NewTitanPipelineExecModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) TitanPipelineExecModel {
	return &customTitanPipelineExecModel{
		defaultTitanPipelineExecModel: newTitanPipelineExecModel(conn, c, opts...),
	}
}

func (m *customTitanPipelineExecModel) TransactExecSteps(ctx context.Context, exec *TitanPipelineExec, steps []*TitanPipelineStepExec) (int64, error) {
	var execId int64
	err := m.TransactCtx(ctx, func(ctx context.Context, session sqlx.Session) error {
		query := fmt.Sprintf("insert into %s (%s) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table, titanPipelineExecRowsExpectAutoSet)
		res, err := session.ExecCtx(ctx, query,
			exec.PipelineId, exec.PipelineName, exec.ExecNo, exec.TriggerType, exec.TriggerBy,
			exec.GitBranch, exec.GitCommit, exec.RuntimeParams, exec.Status, exec.WorkflowId,
			exec.StartTime, exec.EndTime, exec.DurationMs, exec.Artifacts)
		if err != nil {
			return err
		}
		execId, err = res.LastInsertId()
		if err != nil {
			return err
		}

		stepQuery := fmt.Sprintf("insert into %s (%s) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "`titan_pipeline_step_exec`", titanPipelineStepExecRowsExpectAutoSet)
		for _, step := range steps {
			// 事务内回填执行 ID，保证步骤完整归属执行记录
			step.ExecId = execId
			if _, err := session.ExecCtx(ctx, stepQuery,
				step.ExecId, step.StageId, step.StepId, step.StepName, step.StepType,
				step.Status, step.LogPath, step.ErrorMsg, step.StartTime, step.EndTime, step.DurationMs); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return 0, err
	}
	return execId, nil
}

func (m *customTitanPipelineExecModel) FinishWithStatus(ctx context.Context, id int64, fromStatuses []string, toStatus string) (bool, error) {
	if len(fromStatuses) == 0 {
		return false, fmt.Errorf("fromStatuses 不能为空")
	}
	placeholders := ""
	args := make([]interface{}, 0, len(fromStatuses)+2)
	for i, s := range fromStatuses {
		if i > 0 {
			placeholders += ", "
		}
		placeholders += "?"
		args = append(args, s)
	}
	args = append(args, toStatus, id)
	idKey := fmt.Sprintf("%s%v", cacheTitanPipelineExecIdPrefix, id)
	var rows int64
	_, err := m.ExecCtx(ctx, func(ctx context.Context, conn sqlx.SqlConn) (sql.Result, error) {
		res, err := conn.ExecCtx(ctx,
			fmt.Sprintf("update %s set `status` = ?, `end_time` = NOW() where `id` = ? and `status` in (%s)", m.table, placeholders),
			args...)
		if err != nil {
			return nil, err
		}
		rows, err = res.RowsAffected()
		if err != nil {
			return nil, err
		}
		return res, nil
	}, idKey)
	if err != nil {
		return false, err
	}
	return rows > 0, nil
}

// TitanPipelineExecLight 执行记录列表轻量结构（不含 runtime_params/artifacts JSON 大字段，
// 供部分列 SELECT 扫描使用——go-zero sqlx 严格模式下列数必须与 struct 字段数一致）
type TitanPipelineExecLight struct {
	Id           int64          `db:"id"`
	PipelineId   int64          `db:"pipeline_id"`
	PipelineName string         `db:"pipeline_name"`
	ExecNo       string         `db:"exec_no"`
	TriggerType  string         `db:"trigger_type"`
	TriggerBy    int64          `db:"trigger_by"`
	GitBranch    string         `db:"git_branch"`
	GitCommit    string         `db:"git_commit"`
	Status       string         `db:"status"`
	WorkflowId   string         `db:"workflow_id"`
	StartTime    sql.NullTime   `db:"start_time"`
	EndTime      sql.NullTime   `db:"end_time"`
	DurationMs   int64          `db:"duration_ms"`
	CreateTime   time.Time      `db:"create_time"`
	UpdateTime   time.Time      `db:"update_time"`
}

// titanPipelineExecLightColumns 列表轻量列（剔除 runtime_params / artifacts JSON 大字段）
const titanPipelineExecLightColumns = "id, pipeline_id, pipeline_name, exec_no, trigger_type, trigger_by, git_branch, git_commit, status, workflow_id, start_time, end_time, duration_ms, create_time, update_time"

func (m *customTitanPipelineExecModel) ListLightByPage(ctx context.Context, pipelineId int64, status string, offset, limit int64) ([]*TitanPipelineExecLight, int64, error) {
	where := "WHERE 1=1"
	var args []interface{}
	if pipelineId > 0 {
		where += " AND pipeline_id = ?"
		args = append(args, pipelineId)
	}
	if status != "" {
		where += " AND status = ?"
		args = append(args, status)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s %s", m.table, where)
	if err := m.QueryRowNoCacheCtx(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	var execs []*TitanPipelineExecLight
	listQuery := fmt.Sprintf("SELECT %s FROM %s %s ORDER BY id DESC LIMIT ?, ?", titanPipelineExecLightColumns, m.table, where)
	args = append(args, offset, limit)
	if err := m.QueryRowsNoCacheCtx(ctx, &execs, listQuery, args...); err != nil {
		return nil, 0, err
	}
	return execs, total, nil
}
