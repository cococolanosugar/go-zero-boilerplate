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

// ---- deploy 用内存桩 ----

type stubEnvModel struct {
	record *model.TitanEnv
}

func (s *stubEnvModel) Insert(ctx context.Context, data *model.TitanEnv) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *stubEnvModel) FindOne(ctx context.Context, id int64) (*model.TitanEnv, error) {
	if s.record == nil {
		return nil, model.ErrNotFound
	}
	cp := *s.record
	return &cp, nil
}
func (s *stubEnvModel) FindOneByProjectIdEnvCode(ctx context.Context, projectId int64, envCode string) (*model.TitanEnv, error) {
	return nil, model.ErrNotFound
}
func (s *stubEnvModel) CountByProject(ctx context.Context, projectId int64) (int64, error) {
	return 0, nil
}
func (s *stubEnvModel) ListByProject(ctx context.Context, projectId int64) ([]*model.TitanEnv, error) {
	return nil, nil
}
func (s *stubEnvModel) Update(ctx context.Context, data *model.TitanEnv) error { return nil }
func (s *stubEnvModel) Delete(ctx context.Context, id int64) error              { return nil }

type stubAppModel struct {
	record *model.TitanApp
}

func (s *stubAppModel) Insert(ctx context.Context, data *model.TitanApp) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *stubAppModel) FindOne(ctx context.Context, id int64) (*model.TitanApp, error) {
	if s.record == nil {
		return nil, model.ErrNotFound
	}
	cp := *s.record
	return &cp, nil
}
func (s *stubAppModel) FindOneByProjectIdName(ctx context.Context, projectId int64, name string) (*model.TitanApp, error) {
	return nil, model.ErrNotFound
}
func (s *stubAppModel) ListLightByPage(ctx context.Context, projectId int64, offset, limit int64) ([]*model.TitanAppLight, int64, error) {
	return nil, 0, nil
}
func (s *stubAppModel) FindByIds(ctx context.Context, ids []int64) (map[int64]*model.TitanAppLight, error) {
	return map[int64]*model.TitanAppLight{}, nil
}
func (s *stubAppModel) ListLightByProject(ctx context.Context, projectId int64) ([]*model.TitanAppLight, error) {
	return nil, nil
}
func (s *stubAppModel) CountByProject(ctx context.Context, projectId int64) (int64, error) {
	return 0, nil
}
func (s *stubAppModel) Update(ctx context.Context, data *model.TitanApp) error { return nil }
func (s *stubAppModel) Delete(ctx context.Context, id int64) error             { return nil }

type stubArtifactModel struct {
	record *model.TitanArtifact
}

func (s *stubArtifactModel) Insert(ctx context.Context, data *model.TitanArtifact) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *stubArtifactModel) FindOne(ctx context.Context, id int64) (*model.TitanArtifact, error) {
	if s.record == nil {
		return nil, model.ErrNotFound
	}
	cp := *s.record
	return &cp, nil
}
func (s *stubArtifactModel) FindOneByAppIdImageTag(ctx context.Context, appId int64, imageTag string) (*model.TitanArtifact, error) {
	return nil, model.ErrNotFound
}
func (s *stubArtifactModel) ListByPage(ctx context.Context, projectId, appId int64, offset, limit int64) ([]*model.TitanArtifact, int64, error) {
	return nil, 0, nil
}
func (s *stubArtifactModel) FindByIds(ctx context.Context, ids []int64) (map[int64]*model.TitanArtifact, error) {
	return map[int64]*model.TitanArtifact{}, nil
}
func (s *stubArtifactModel) CountByApp(ctx context.Context, appId int64) (int64, error) {
	return 0, nil
}
func (s *stubArtifactModel) Update(ctx context.Context, data *model.TitanArtifact) error {
	return nil
}
func (s *stubArtifactModel) Delete(ctx context.Context, id int64) error { return nil }

type stubClusterModel struct {
	record *model.TitanCluster
}

func (s *stubClusterModel) Insert(ctx context.Context, data *model.TitanCluster) (sql.Result, error) {
	return stubResult{}, nil
}
func (s *stubClusterModel) FindOne(ctx context.Context, id int64) (*model.TitanCluster, error) {
	if s.record == nil {
		return nil, model.ErrNotFound
	}
	cp := *s.record
	return &cp, nil
}
func (s *stubClusterModel) FindOneByName(ctx context.Context, name string) (*model.TitanCluster, error) {
	return nil, model.ErrNotFound
}
func (s *stubClusterModel) ListByPage(ctx context.Context, env string, offset, limit int64) ([]*model.TitanClusterLight, int64, error) {
	return nil, 0, nil
}
func (s *stubClusterModel) FindByIds(ctx context.Context, ids []int64) (map[int64]*model.TitanClusterLight, error) {
	return map[int64]*model.TitanClusterLight{}, nil
}
func (s *stubClusterModel) Update(ctx context.Context, data *model.TitanCluster) error { return nil }
func (s *stubClusterModel) Delete(ctx context.Context, id int64) error                 { return nil }

// stubBindingModel 带状态机的内存桩：支持 LockForDeploy/FinishDeploy 语义与重复部署模拟
type stubBindingModel struct {
	existing  *model.TitanEnvAppBinding
	insertErr error   // 模拟并发插入撞唯一键
	updates   []model.TitanEnvAppBinding
}

func (s *stubBindingModel) Insert(ctx context.Context, data *model.TitanEnvAppBinding) (sql.Result, error) {
	if s.insertErr != nil {
		return nil, s.insertErr
	}
	s.existing = data
	return stubResult{}, nil
}
func (s *stubBindingModel) FindOne(ctx context.Context, id int64) (*model.TitanEnvAppBinding, error) {
	if s.existing == nil {
		return nil, model.ErrNotFound
	}
	cp := *s.existing
	return &cp, nil
}
func (s *stubBindingModel) FindOneByEnvIdAppId(ctx context.Context, envId, appId int64) (*model.TitanEnvAppBinding, error) {
	if s.existing == nil {
		return nil, model.ErrNotFound
	}
	cp := *s.existing
	return &cp, nil
}
func (s *stubBindingModel) Update(ctx context.Context, data *model.TitanEnvAppBinding) error {
	cp := *data
	s.updates = append(s.updates, cp)
	s.existing = &cp
	return nil
}
func (s *stubBindingModel) Delete(ctx context.Context, id int64) error { return nil }
func (s *stubBindingModel) LockForDeploy(ctx context.Context, envId, appId int64) (bool, error) {
	if s.existing != nil && s.existing.Status == model.BindingStatusDeploying {
		return false, nil
	}
	if s.existing != nil {
		s.existing.Status = model.BindingStatusDeploying
	}
	return true, nil
}
func (s *stubBindingModel) FinishDeploy(ctx context.Context, binding *model.TitanEnvAppBinding, status string) error {
	if s.existing != nil && s.existing.Status == model.BindingStatusDeploying {
		s.existing.Status = status
		cp := *s.existing
		s.updates = append(s.updates, cp)
	}
	return nil
}

func (s *stubBindingModel) CountByEnv(ctx context.Context, envId int64) (int64, error) {
	return 0, nil
}
func (s *stubBindingModel) CountByApp(ctx context.Context, appId int64) (int64, error) {
	return 0, nil
}
func (s *stubBindingModel) CountByEnvIds(ctx context.Context, envIds []int64) (map[int64]int64, error) {
	return map[int64]int64{}, nil
}
func (s *stubBindingModel) ListByEnvId(ctx context.Context, envId int64) ([]*model.TitanEnvAppBinding, error) {
	return nil, nil
}
func (s *stubBindingModel) ListByEnvIds(ctx context.Context, envIds []int64) ([]*model.TitanEnvAppBinding, error) {
	return nil, nil
}

func deploySvc(env *stubEnvModel, app *stubAppModel, art *stubArtifactModel, cluster *stubClusterModel, binding *stubBindingModel) *svc.ServiceContext {
	return &svc.ServiceContext{
		EnvModel:           env,
		AppModel:           app,
		ArtifactModel:      art,
		ClusterModel:       cluster,
		EnvAppBindingModel: binding,
	}
}

func baseDeployData() (*stubEnvModel, *stubAppModel, *stubArtifactModel, *stubClusterModel) {
	env := &stubEnvModel{record: &model.TitanEnv{Id: 10, ProjectId: 1, Name: "dev", Namespace: "shop-dev", ClusterId: 100}}
	app := &stubAppModel{record: &model.TitanApp{Id: 20, ProjectId: 1, Name: "order-service", Status: 1}}
	art := &stubArtifactModel{record: &model.TitanArtifact{Id: 30, AppId: 20, ImageUrl: "registry.internal/shop/order-service", ImageTag: "v1.0.0", Status: model.ArtifactStatusAvailable}}
	cluster := &stubClusterModel{record: &model.TitanCluster{Id: 100, Name: "dev-cluster"}}
	return env, app, art, cluster
}

// 跨项目部署被拒绝：环境归属项目 2，请求却携带项目 1
func TestDeployArtifactCrossProjectRejected(t *testing.T) {
	env, app, art, cluster := baseDeployData()
	env.record.ProjectId = 2
	binding := &stubBindingModel{}
	l := NewDeployArtifactLogic(context.Background(), deploySvc(env, app, art, cluster, binding))

	_, err := l.DeployArtifact(&titan.DeployArtifactReq{EnvId: 10, AppId: 20, ArtifactId: 30, ProjectId: 1})
	assert.Error(t, err)
	code, _ := xerr.FromError(err)
	assert.EqualValues(t, xerr.RecordNotFound, code, "跨项目访问应返回记录不存在，不泄露资源")
}

// 制品与应用不匹配被拒绝
func TestDeployArtifactArtifactAppMismatchRejected(t *testing.T) {
	env, app, art, cluster := baseDeployData()
	art.record.AppId = 999
	binding := &stubBindingModel{}
	l := NewDeployArtifactLogic(context.Background(), deploySvc(env, app, art, cluster, binding))

	_, err := l.DeployArtifact(&titan.DeployArtifactReq{EnvId: 10, AppId: 20, ArtifactId: 30, ProjectId: 1})
	assert.Error(t, err)
	code, _ := xerr.FromError(err)
	assert.EqualValues(t, xerr.RecordNotFound, code)
}

// 部署进行中重复提交被拒绝（不产生第二次下发）
func TestDeployArtifactDuplicateDeployRejected(t *testing.T) {
	env, app, art, cluster := baseDeployData()
	app.record.DeploySpec = "" // 无模板路径也须走锁
	binding := &stubBindingModel{existing: &model.TitanEnvAppBinding{Id: 5, EnvId: 10, AppId: 20, Status: model.BindingStatusDeploying}}
	l := NewDeployArtifactLogic(context.Background(), deploySvc(env, app, art, cluster, binding))

	_, err := l.DeployArtifact(&titan.DeployArtifactReq{EnvId: 10, AppId: 20, ArtifactId: 30, ProjectId: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "部署进行中")
}

// 并发插入撞唯一键视为部署进行中
func TestDeployArtifactConcurrentInsertRejected(t *testing.T) {
	env, app, art, cluster := baseDeployData()
	app.record.DeploySpec = ""
	binding := &stubBindingModel{insertErr: assert.AnError}
	// 用 1062 模拟：直接构造含 Duplicate entry 的错误
	binding.insertErr = errDuplicate()
	l := NewDeployArtifactLogic(context.Background(), deploySvc(env, app, art, cluster, binding))

	_, err := l.DeployArtifact(&titan.DeployArtifactReq{EnvId: 10, AppId: 20, ArtifactId: 30, ProjectId: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "部署进行中")
}

// 停用应用被拒绝
func TestDeployArtifactDisabledAppRejected(t *testing.T) {
	env, app, art, cluster := baseDeployData()
	app.record.Status = 0
	binding := &stubBindingModel{}
	l := NewDeployArtifactLogic(context.Background(), deploySvc(env, app, art, cluster, binding))

	_, err := l.DeployArtifact(&titan.DeployArtifactReq{EnvId: 10, AppId: 20, ArtifactId: 30, ProjectId: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "停用")
}

// 非法镜像引用被拒绝且解锁为 FAILED
func TestDeployArtifactInvalidImageRejectedAndUnlocked(t *testing.T) {
	env, app, art, cluster := baseDeployData()
	art.record.ImageUrl = "registry.internal/shop/order-service\n-evil:kind"
	app.record.DeploySpec = ""
	binding := &stubBindingModel{}
	l := NewDeployArtifactLogic(context.Background(), deploySvc(env, app, art, cluster, binding))

	_, err := l.DeployArtifact(&titan.DeployArtifactReq{EnvId: 10, AppId: 20, ArtifactId: 30, ProjectId: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "镜像引用格式非法")
	assert.Equal(t, model.BindingStatusFailed, binding.existing.Status, "失败后绑定不得残留 DEPLOYING")
}

// 集群下发失败返回失败且解锁为 FAILED（不出现假成功）
func TestDeployArtifactApplyFailureReturnsErrorAndUnlocks(t *testing.T) {
	env, app, art, cluster := baseDeployData()
	app.record.DeploySpec = "kind: Deployment\nmetadata:\n  name: order-service\n"
	binding := &stubBindingModel{existing: &model.TitanEnvAppBinding{Id: 5, EnvId: 10, AppId: 20, Status: model.BindingStatusRunning}}
	l := NewDeployArtifactLogic(context.Background(), deploySvc(env, app, art, cluster, binding))

	restore := stubClusterApply(t, func(ctx context.Context, kubeconfig, namespace, appName, renderedYaml string) (int32, int32, error) {
		return 0, 0, xerr.NewErrMsg("集群下发失败: boom")
	})
	defer restore()

	_, err := l.DeployArtifact(&titan.DeployArtifactReq{EnvId: 10, AppId: 20, ArtifactId: 30, ProjectId: 1})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "集群下发失败")
	assert.Equal(t, model.BindingStatusFailed, binding.existing.Status, "下发失败必须解锁为 FAILED")
}

// 部署成功：绑定置 RUNNING、副本数取真实回读值、制品指向更新
func TestDeployArtifactSuccessSetsRunningWithRealReplicas(t *testing.T) {
	env, app, art, cluster := baseDeployData()
	app.record.DeploySpec = "kind: Deployment\nmetadata:\n  name: order-service\n"
	binding := &stubBindingModel{existing: &model.TitanEnvAppBinding{Id: 5, EnvId: 10, AppId: 20, Status: model.BindingStatusStopped}}
	l := NewDeployArtifactLogic(context.Background(), deploySvc(env, app, art, cluster, binding))

	restore := stubClusterApply(t, func(ctx context.Context, kubeconfig, namespace, appName, renderedYaml string) (int32, int32, error) {
		return 2, 2, nil
	})
	defer restore()

	resp, err := l.DeployArtifact(&titan.DeployArtifactReq{EnvId: 10, AppId: 20, ArtifactId: 30, ProjectId: 1, OperatorId: 7})
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, model.BindingStatusRunning, binding.existing.Status)
	assert.EqualValues(t, 2, binding.existing.ReadyReplicas, "副本数取集群真实回读值")
	assert.EqualValues(t, 2, binding.existing.TotalReplicas)
	assert.EqualValues(t, 30, binding.existing.CurrentArtifactId)
}

// stubClusterApply 替换集群下发缝并在测试结束后还原
func stubClusterApply(t *testing.T, fn func(ctx context.Context, kubeconfig, namespace, appName, renderedYaml string) (int32, int32, error)) func() {
	t.Helper()
	orig := clusterApplyFn
	clusterApplyFn = fn
	return func() { clusterApplyFn = orig }
}

func errDuplicate() error {
	return &duplicateErr{}
}

type duplicateErr struct{}

func (*duplicateErr) Error() string { return "Error 1062: Duplicate entry '10:20' for key 'uk_env_app'" }
