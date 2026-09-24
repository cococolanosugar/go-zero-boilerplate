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

// ---- 删除保护专用桩（计数可配置） ----

type dStubProjectModel struct{ exists bool }

func (s *dStubProjectModel) Insert(ctx context.Context, data *model.TitanProject) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *dStubProjectModel) FindOne(ctx context.Context, id int64) (*model.TitanProject, error) {
	if !s.exists {
		return nil, model.ErrNotFound
	}
	return &model.TitanProject{Id: id}, nil
}
func (s *dStubProjectModel) FindOneByName(ctx context.Context, name string) (*model.TitanProject, error) {
	return nil, model.ErrNotFound
}
func (s *dStubProjectModel) Update(ctx context.Context, data *model.TitanProject) error { return nil }
func (s *dStubProjectModel) Delete(ctx context.Context, id int64) error                 { return nil }
func (s *dStubProjectModel) ListByPage(ctx context.Context, keyword string, offset, limit int64) ([]*model.TitanProject, int64, error) {
	return nil, 0, nil
}
func (s *dStubProjectModel) CountAppsAndEnvsByProject(ctx context.Context, projectIds []int64) (map[int64]*model.ProjectResourceCount, error) {
	return map[int64]*model.ProjectResourceCount{}, nil
}

type dStubAppModel struct{ count int64 }

func (s *dStubAppModel) Insert(ctx context.Context, data *model.TitanApp) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *dStubAppModel) FindOne(ctx context.Context, id int64) (*model.TitanApp, error) {
	if id == 999 {
		return nil, model.ErrNotFound
	}
	return &model.TitanApp{Id: id, ProjectId: 1}, nil
}
func (s *dStubAppModel) FindOneByProjectIdName(ctx context.Context, projectId int64, name string) (*model.TitanApp, error) {
	return nil, model.ErrNotFound
}
func (s *dStubAppModel) CountByProject(ctx context.Context, projectId int64) (int64, error) {
	return s.count, nil
}
func (s *dStubAppModel) ListLightByPage(ctx context.Context, projectId int64, offset, limit int64) ([]*model.TitanAppLight, int64, error) {
	return nil, 0, nil
}
func (s *dStubAppModel) FindByIds(ctx context.Context, ids []int64) (map[int64]*model.TitanAppLight, error) {
	return map[int64]*model.TitanAppLight{}, nil
}
func (s *dStubAppModel) ListLightByProject(ctx context.Context, projectId int64) ([]*model.TitanAppLight, error) {
	return nil, nil
}
func (s *dStubAppModel) Update(ctx context.Context, data *model.TitanApp) error { return nil }
func (s *dStubAppModel) Delete(ctx context.Context, id int64) error             { return nil }

type dStubEnvModel struct{ count int64 }

func (s *dStubEnvModel) Insert(ctx context.Context, data *model.TitanEnv) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *dStubEnvModel) FindOne(ctx context.Context, id int64) (*model.TitanEnv, error) {
	if id == 999 {
		return nil, model.ErrNotFound
	}
	return &model.TitanEnv{Id: id, ProjectId: 1}, nil
}
func (s *dStubEnvModel) FindOneByProjectIdEnvCode(ctx context.Context, projectId int64, envCode string) (*model.TitanEnv, error) {
	return nil, model.ErrNotFound
}
func (s *dStubEnvModel) CountByProject(ctx context.Context, projectId int64) (int64, error) {
	return s.count, nil
}
func (s *dStubEnvModel) ListByProject(ctx context.Context, projectId int64) ([]*model.TitanEnv, error) {
	return nil, nil
}
func (s *dStubEnvModel) Update(ctx context.Context, data *model.TitanEnv) error { return nil }
func (s *dStubEnvModel) Delete(ctx context.Context, id int64) error             { return nil }

type dStubArtifactModel struct{ count int64 }

func (s *dStubArtifactModel) Insert(ctx context.Context, data *model.TitanArtifact) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *dStubArtifactModel) FindOne(ctx context.Context, id int64) (*model.TitanArtifact, error) {
	return nil, model.ErrNotFound
}
func (s *dStubArtifactModel) FindOneByAppIdImageTag(ctx context.Context, appId int64, imageTag string) (*model.TitanArtifact, error) {
	return nil, model.ErrNotFound
}
func (s *dStubArtifactModel) CountByApp(ctx context.Context, appId int64) (int64, error) {
	return s.count, nil
}
func (s *dStubArtifactModel) ListByPage(ctx context.Context, projectId, appId int64, offset, limit int64) ([]*model.TitanArtifact, int64, error) {
	return nil, 0, nil
}
func (s *dStubArtifactModel) FindByIds(ctx context.Context, ids []int64) (map[int64]*model.TitanArtifact, error) {
	return map[int64]*model.TitanArtifact{}, nil
}
func (s *dStubArtifactModel) Update(ctx context.Context, data *model.TitanArtifact) error {
	return nil
}
func (s *dStubArtifactModel) Delete(ctx context.Context, id int64) error { return nil }

type dStubBindingModel struct{ envCount, appCount int64 }

func (s *dStubBindingModel) Insert(ctx context.Context, data *model.TitanEnvAppBinding) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *dStubBindingModel) FindOne(ctx context.Context, id int64) (*model.TitanEnvAppBinding, error) {
	return nil, model.ErrNotFound
}
func (s *dStubBindingModel) FindOneByEnvIdAppId(ctx context.Context, envId, appId int64) (*model.TitanEnvAppBinding, error) {
	return nil, model.ErrNotFound
}
func (s *dStubBindingModel) CountByEnv(ctx context.Context, envId int64) (int64, error) {
	return s.envCount, nil
}
func (s *dStubBindingModel) CountByApp(ctx context.Context, appId int64) (int64, error) {
	return s.appCount, nil
}
func (s *dStubBindingModel) CountByEnvIds(ctx context.Context, envIds []int64) (map[int64]int64, error) {
	return map[int64]int64{}, nil
}
func (s *dStubBindingModel) ListByEnvId(ctx context.Context, envId int64) ([]*model.TitanEnvAppBinding, error) {
	return nil, nil
}
func (s *dStubBindingModel) ListByEnvIds(ctx context.Context, envIds []int64) ([]*model.TitanEnvAppBinding, error) {
	return nil, nil
}
func (s *dStubBindingModel) LockForDeploy(ctx context.Context, envId, appId int64) (bool, error) {
	return true, nil
}
func (s *dStubBindingModel) FinishDeploy(ctx context.Context, binding *model.TitanEnvAppBinding, status string) error {
	return nil
}
func (s *dStubBindingModel) Update(ctx context.Context, data *model.TitanEnvAppBinding) error {
	return nil
}
func (s *dStubBindingModel) Delete(ctx context.Context, id int64) error { return nil }

// 删除含应用的项目被拒绝
func TestDeleteProjectWithAppsRejected(t *testing.T) {
	svcCtx := &svc.ServiceContext{
		ProjectModel: &dStubProjectModel{exists: true},
		AppModel:     &dStubAppModel{count: 2},
		EnvModel:     &dStubEnvModel{},
	}
	l := NewDeleteProjectLogic(context.Background(), svcCtx)
	_, err := l.DeleteProject(&titan.DeleteProjectReq{Id: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "应用")
}

// 删除含环境的项目被拒绝
func TestDeleteProjectWithEnvsRejected(t *testing.T) {
	svcCtx := &svc.ServiceContext{
		ProjectModel: &dStubProjectModel{exists: true},
		AppModel:     &dStubAppModel{},
		EnvModel:     &dStubEnvModel{count: 3},
	}
	l := NewDeleteProjectLogic(context.Background(), svcCtx)
	_, err := l.DeleteProject(&titan.DeleteProjectReq{Id: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "环境")
}

// 无子资源的项目删除成功
func TestDeleteProjectCleanSucceeds(t *testing.T) {
	svcCtx := &svc.ServiceContext{
		ProjectModel: &dStubProjectModel{exists: true},
		AppModel:     &dStubAppModel{},
		EnvModel:     &dStubEnvModel{},
	}
	l := NewDeleteProjectLogic(context.Background(), svcCtx)
	resp, err := l.DeleteProject(&titan.DeleteProjectReq{Id: 1})
	assert.NoError(t, err)
	assert.NotNil(t, resp)
}

// 删除已不存在的项目返回记录不存在业务码
func TestDeleteProjectNotFound(t *testing.T) {
	svcCtx := &svc.ServiceContext{ProjectModel: &dStubProjectModel{exists: false}}
	l := NewDeleteProjectLogic(context.Background(), svcCtx)
	_, err := l.DeleteProject(&titan.DeleteProjectReq{Id: 999})
	assert.Error(t, err)
	code, _ := xerr.FromError(err)
	assert.EqualValues(t, xerr.RecordNotFound, code)
}

// 删除含绑定的应用被拒绝
func TestDeleteAppWithBindingsRejected(t *testing.T) {
	svcCtx := &svc.ServiceContext{
		AppModel:           &dStubAppModel{},
		EnvAppBindingModel: &dStubBindingModel{appCount: 1},
		ArtifactModel:      &dStubArtifactModel{},
	}
	l := NewDeleteAppLogic(context.Background(), svcCtx)
	_, err := l.DeleteApp(&titan.DeleteAppReq{Id: 5, ProjectId: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "绑定")
}

// 删除含制品的应用被拒绝
func TestDeleteAppWithArtifactsRejected(t *testing.T) {
	svcCtx := &svc.ServiceContext{
		AppModel:           &dStubAppModel{},
		EnvAppBindingModel: &dStubBindingModel{},
		ArtifactModel:      &dStubArtifactModel{count: 4},
	}
	l := NewDeleteAppLogic(context.Background(), svcCtx)
	_, err := l.DeleteApp(&titan.DeleteAppReq{Id: 5, ProjectId: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "制品")
}

// 跨项目删除应用被拒绝（归属校验返回记录不存在）
func TestDeleteAppCrossProjectRejected(t *testing.T) {
	svcCtx := &svc.ServiceContext{
		AppModel:           &dStubAppModel{},
		EnvAppBindingModel: &dStubBindingModel{},
		ArtifactModel:      &dStubArtifactModel{},
	}
	l := NewDeleteAppLogic(context.Background(), svcCtx)
	_, err := l.DeleteApp(&titan.DeleteAppReq{Id: 5, ProjectId: 77})
	assert.Error(t, err)
	code, _ := xerr.FromError(err)
	assert.EqualValues(t, xerr.RecordNotFound, code)
}

// 删除含绑定的环境被拒绝
func TestDeleteEnvWithBindingsRejected(t *testing.T) {
	svcCtx := &svc.ServiceContext{
		EnvModel:           &dStubEnvModel{},
		EnvAppBindingModel: &dStubBindingModel{envCount: 2},
	}
	l := NewDeleteEnvLogic(context.Background(), svcCtx)
	_, err := l.DeleteEnv(&titan.DeleteEnvReq{Id: 8, ProjectId: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "绑定")
}

// 无绑定的环境删除成功
func TestDeleteEnvCleanSucceeds(t *testing.T) {
	svcCtx := &svc.ServiceContext{
		EnvModel:           &dStubEnvModel{},
		EnvAppBindingModel: &dStubBindingModel{},
	}
	l := NewDeleteEnvLogic(context.Background(), svcCtx)
	resp, err := l.DeleteEnv(&titan.DeleteEnvReq{Id: 8, ProjectId: 1})
	assert.NoError(t, err)
	assert.NotNil(t, resp)
}
