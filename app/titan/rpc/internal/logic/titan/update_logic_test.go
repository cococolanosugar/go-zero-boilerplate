package titanlogic

import (
	"context"
	"database/sql"
	"testing"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/stretchr/testify/assert"
)

func svcWithPipeline(m model.TitanPipelineModel) *svc.ServiceContext {
	return &svc.ServiceContext{PipelineModel: m}
}

func svcWithIntegration(m model.TitanIntegrationModel) *svc.ServiceContext {
	return &svc.ServiceContext{IntegrationModel: m}
}

func getErrCode(err error) uint32 {
	code, _ := xerr.FromError(err)
	return code
}

// ---- 内存桩模型：满足 model.TitanPipelineModel / model.TitanIntegrationModel 接口 ----

type stubPipelineModel struct {
	record *model.TitanPipeline
}

func (s *stubPipelineModel) Insert(ctx context.Context, data *model.TitanPipeline) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *stubPipelineModel) FindOne(ctx context.Context, id int64) (*model.TitanPipeline, error) {
	if s.record == nil {
		return nil, model.ErrNotFound
	}
	cp := *s.record
	return &cp, nil
}
func (s *stubPipelineModel) FindOneByName(ctx context.Context, name string) (*model.TitanPipeline, error) {
	return nil, model.ErrNotFound
}
func (s *stubPipelineModel) Update(ctx context.Context, data *model.TitanPipeline) error {
	s.record = data
	return nil
}
func (s *stubPipelineModel) ListByPage(ctx context.Context, category, keyword string, offset, limit int64) ([]*model.TitanPipeline, int64, error) {
	return nil, 0, nil
}
func (s *stubPipelineModel) Delete(ctx context.Context, id int64) error { return nil }

type stubIntegrationModel struct {
	record *model.TitanIntegration
}

func (s *stubIntegrationModel) Insert(ctx context.Context, data *model.TitanIntegration) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *stubIntegrationModel) FindOne(ctx context.Context, id int64) (*model.TitanIntegration, error) {
	if s.record == nil {
		return nil, model.ErrNotFound
	}
	cp := *s.record
	return &cp, nil
}
func (s *stubIntegrationModel) FindOneByName(ctx context.Context, name string) (*model.TitanIntegration, error) {
	return nil, model.ErrNotFound
}
func (s *stubIntegrationModel) ListByPage(ctx context.Context, category string, offset, limit int64) ([]*model.TitanIntegration, int64, error) {
	return nil, 0, nil
}
func (s *stubIntegrationModel) Update(ctx context.Context, data *model.TitanIntegration) error {
	s.record = data
	return nil
}
func (s *stubIntegrationModel) Delete(ctx context.Context, id int64) error { return nil }

type stubResult struct{}

func (stubResult) LastInsertId() (int64, error) { return 1, nil }
func (stubResult) RowsAffected() (int64, error) { return 1, nil }

// ---- 用例 ----

func strPtr(s string) *string { return &s }
func int32Ptr(i int32) *int32 { return &i }

func TestUpdatePipelinePartialUpdateKeepsOtherFields(t *testing.T) {
	stub := &stubPipelineModel{record: &model.TitanPipeline{
		Id:          1,
		Name:        "ci",
		DisplayName: "旧名称",
		Status:      1,
		Description: "原描述",
	}}
	l := NewUpdatePipelineLogic(context.Background(), svcWithPipeline(stub))

	// 只传 displayName，不传 status/description
	_, err := l.UpdatePipeline(&titan.UpdatePipelineReq{
		Id:          1,
		DisplayName: strPtr("新名称"),
	})
	assert.NoError(t, err)
	assert.Equal(t, "新名称", stub.record.DisplayName)
	assert.EqualValues(t, 1, stub.record.Status, "未传 status 必须保持原值")
	assert.Equal(t, "原描述", stub.record.Description, "未传 description 必须保持原值")
}

func TestUpdatePipelineExplicitEmptyDescriptionClears(t *testing.T) {
	stub := &stubPipelineModel{record: &model.TitanPipeline{
		Id:          1,
		Name:        "ci",
		DisplayName: "名称",
		Description: "原描述",
	}}
	l := NewUpdatePipelineLogic(context.Background(), svcWithPipeline(stub))

	_, err := l.UpdatePipeline(&titan.UpdatePipelineReq{
		Description: strPtr(""),
	})
	assert.NoError(t, err)
	assert.Equal(t, "", stub.record.Description, "显式空描述应清空")
	assert.Equal(t, "名称", stub.record.DisplayName, "未传字段保持不变")
}

func TestUpdateIntegrationStatusNotClobbered(t *testing.T) {
	stub := &stubIntegrationModel{record: &model.TitanIntegration{
		Id:          1,
		Name:        "gitlab",
		Status:      1,
		Description: "原说明",
		Config:      "encrypted",
	}}
	l := NewUpdateIntegrationLogic(context.Background(), svcWithIntegration(stub))

	_, err := l.UpdateIntegration(&titan.UpdateIntegrationReq{
		Name: strPtr("gitlab-new"),
	})
	assert.NoError(t, err)
	assert.Equal(t, "gitlab-new", stub.record.Name)
	assert.EqualValues(t, 1, stub.record.Status, "未传 status 不得被置 0")
	assert.Equal(t, "原说明", stub.record.Description, "未传 description 不得被清空")
}

func TestUpdateIntegrationMaskedConfigSkipped(t *testing.T) {
	stub := &stubIntegrationModel{record: &model.TitanIntegration{
		Id:     1,
		Name:   "gitlab",
		Config: "encrypted-real",
	}}
	l := NewUpdateIntegrationLogic(context.Background(), svcWithIntegration(stub))

	_, err := l.UpdateIntegration(&titan.UpdateIntegrationReq{
		Config: strPtr("****abcd"),
	})
	assert.NoError(t, err)
	assert.Equal(t, "encrypted-real", stub.record.Config, "掩码值提交不得覆盖库中原值")
}

func TestUpdateRecordNotFound(t *testing.T) {
	l := NewUpdatePipelineLogic(context.Background(), svcWithPipeline(&stubPipelineModel{record: nil}))
	_, err := l.UpdatePipeline(&titan.UpdatePipelineReq{Id: 999})
	assert.Error(t, err)
	assert.EqualValues(t, 100006, getErrCode(err), "记录不存在应返回 xerr.RecordNotFound 业务码")
}

func TestUpdatePipelineDisabledByExplicitZero(t *testing.T) {
	stub := &stubPipelineModel{record: &model.TitanPipeline{
		Id:          1,
		Name:        "ci",
		DisplayName: "名称",
		Status:      1,
	}}
	l := NewUpdatePipelineLogic(context.Background(), svcWithPipeline(stub))

	// 显式传 status=0 表示停用（区别于"不传"）
	_, err := l.UpdatePipeline(&titan.UpdatePipelineReq{Status: int32Ptr(0)})
	assert.NoError(t, err)
	assert.EqualValues(t, 0, stub.record.Status, "显式传 0 才允许停用")
}
