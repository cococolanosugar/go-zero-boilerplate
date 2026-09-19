import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Button,
  Tag,
  Badge,
  Typography,
  Table,
  Empty,
  Spin,
} from 'antd';
import {
  RocketOutlined,
  BranchesOutlined,
  ClusterOutlined,
  ApiOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ArrowRightOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  titanListPipelines,
  titanListExecutions,
  titanListClusters,
  titanListIntegrations,
  titanListProjects,
  type TitanListExecutions200ListItem,
  type TitanListClusters200ListItem,
} from '@zero/api';
import { useIntl } from '../../contexts/LocaleContext';
import { execStatusMap } from '../../constants/status';

const { Text } = Typography;

// 图标属于视图层细节，保留在页面内；颜色/文案统一引用 constants/status.ts
const statusIconMap: Record<string, React.ReactNode> = {
  PENDING: <SyncOutlined />,
  RUNNING: <SyncOutlined spin />,
  WAITING_APPROVAL: <SyncOutlined />,
  SUCCESS: <CheckCircleOutlined />,
  FAILED: <CloseCircleOutlined />,
  CANCELLED: <CloseCircleOutlined />,
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { formatMessage: t } = useIntl();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalPipelines: 0,
    totalExecutions: 0,
    totalClusters: 0,
    totalIntegrations: 0,
  });
  const [recentExecutions, setRecentExecutions] = useState<TitanListExecutions200ListItem[]>([]);
  const [clusters, setClusters] = useState<TitanListClusters200ListItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectRes, pipelineRes, execRes, clusterRes, integrationRes] = await Promise.allSettled([
          titanListProjects({ page: 1, pageSize: 1 }),
          titanListPipelines({ page: 1, pageSize: 1 }),
          titanListExecutions({ page: 1, pageSize: 6 }),
          titanListClusters({ page: 1, pageSize: 10 }),
          titanListIntegrations({ page: 1, pageSize: 1 }),
        ]);

        const totalProjects = projectRes.status === 'fulfilled' ? projectRes.value.total || 0 : 0;
        const totalPipelines = pipelineRes.status === 'fulfilled' ? pipelineRes.value.total || 0 : 0;
        const totalExec = execRes.status === 'fulfilled' ? execRes.value.total || 0 : 0;
        const totalClusters = clusterRes.status === 'fulfilled' ? clusterRes.value.total || 0 : 0;
        const totalIntegrations = integrationRes.status === 'fulfilled' ? integrationRes.value.total || 0 : 0;

        setStats({
          totalProjects,
          totalPipelines,
          totalExecutions: totalExec,
          totalClusters,
          totalIntegrations,
        });

        if (execRes.status === 'fulfilled' && execRes.value.list) {
          setRecentExecutions(execRes.value.list);
        }
        if (clusterRes.status === 'fulfilled' && clusterRes.value.list) {
          setClusters(clusterRes.value.list);
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PageContainer
      header={{
        title: t({ id: 'titan.dashboard.title', defaultMessage: 'Titan 研发交付大盘' }),
        subTitle: t({
          id: 'titan.dashboard.subTitle',
          defaultMessage: '云原生持续交付、Kubernetes 多集群发布与持续集成流水线调度中枢',
        }),
        extra: [
          <Button
            key="create-pipeline"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/pipelines')}
          >
            {t({ id: 'titan.dashboard.newPipeline', defaultMessage: '新建流水线' })}
          </Button>,
          <Button
            key="cluster"
            icon={<ClusterOutlined />}
            onClick={() => navigate('/clusters')}
          >
            {t({ id: 'titan.dashboard.manageClusters', defaultMessage: '纳管集群' })}
          </Button>,
        ],
      }}
    >
      <Spin spinning={loading}>
        {/* Zadig 研发大盘 - 5 核心指标卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={5}>
            <Card variant="borderless" hoverable onClick={() => navigate('/projects')}>
              <Statistic
                title={t({ id: 'titan.dashboard.statProjects', defaultMessage: '交付项目 (Projects)' })}
                value={stats.totalProjects}
                prefix={<ProjectOutlined style={{ color: '#1677ff' }} />}
                suffix={t({ id: 'titan.dashboard.unitProjects', defaultMessage: '个' })}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t({ id: 'titan.dashboard.statProjectsDesc', defaultMessage: '项目 → 应用 → 制品 → 环境' })}
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={4}>
            <Card variant="borderless" hoverable onClick={() => navigate('/pipelines')}>
              <Statistic
                title={t({ id: 'titan.dashboard.statPipelines', defaultMessage: '自定义流水线' })}
                value={stats.totalPipelines}
                prefix={<BranchesOutlined style={{ color: '#722ed1' }} />}
                suffix={t({ id: 'titan.dashboard.unitPipelines', defaultMessage: '条' })}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t({ id: 'titan.dashboard.statPipelinesDesc', defaultMessage: '扩展 CI/CD 编排' })}
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={5}>
            <Card variant="borderless" hoverable onClick={() => navigate('/pipelines')}>
              <Statistic
                title={t({ id: 'titan.dashboard.statRuns', defaultMessage: '累计运行次数 (Runs)' })}
                value={stats.totalExecutions}
                prefix={<RocketOutlined style={{ color: '#52c41a' }} />}
                suffix={t({ id: 'titan.dashboard.unitRuns', defaultMessage: '次' })}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t({ id: 'titan.dashboard.statRunsDesc', defaultMessage: 'Temporal DAG 状态机编排' })}
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={12} lg={5}>
            <Card variant="borderless" hoverable onClick={() => navigate('/clusters')}>
              <Statistic
                title={t({ id: 'titan.dashboard.statClusters', defaultMessage: 'Kubernetes 集群 (Clusters)' })}
                value={stats.totalClusters}
                prefix={<ClusterOutlined style={{ color: '#722ed1' }} />}
                suffix={t({ id: 'titan.dashboard.unitClusters', defaultMessage: '个' })}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t({ id: 'titan.dashboard.statClustersDesc', defaultMessage: '支持 Helm 3 与原生 YAML SSA' })}
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={12} lg={5}>
            <Card variant="borderless" hoverable onClick={() => navigate('/integrations')}>
              <Statistic
                title={t({ id: 'titan.dashboard.statIntegrations', defaultMessage: '系统集成凭据 (Integrations)' })}
                value={stats.totalIntegrations}
                prefix={<ApiOutlined style={{ color: '#fa8c16' }} />}
                suffix={t({ id: 'titan.dashboard.unitIntegrations', defaultMessage: '套' })}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t({ id: 'titan.dashboard.statIntegrationsDesc', defaultMessage: 'Git / Harbor / Jenkins 认证桥接' })}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 最近执行与集群状态 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <PlayCircleOutlined style={{ color: '#1677ff' }} />
                  <span>{t({ id: 'titan.dashboard.recentExecutions', defaultMessage: '最近执行流水 (Recent Executions)' })}</span>
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/pipelines')}>
                  {t({ id: 'titan.dashboard.viewAll', defaultMessage: '查看全部' })} <ArrowRightOutlined />
                </Button>
              }
              variant="borderless"
            >
              <Table
                rowKey="id"
                dataSource={recentExecutions}
                pagination={false}
                size="middle"
                columns={[
                  {
                    title: t({ id: 'titan.dashboard.colExecNo', defaultMessage: '运行编号' }),
                    dataIndex: 'execNo',
                    key: 'execNo',
                    render: (text, record) => (
                      <Button
                        type="link"
                        style={{ padding: 0 }}
                        onClick={() => navigate(`/pipelines/exec/${record.id}`)}
                      >
                        #{text || record.id}
                      </Button>
                    ),
                  },
                  {
                    title: t({ id: 'titan.dashboard.colBranch', defaultMessage: '分支 / Commit' }),
                    dataIndex: 'gitBranch',
                    key: 'gitBranch',
                    render: (text, record) => (
                      <Space>
                        <Tag color="blue">{text || 'main'}</Tag>
                        {record.gitCommit && (
                          <Text code style={{ fontSize: 12 }}>
                            {record.gitCommit.slice(0, 7)}
                          </Text>
                        )}
                      </Space>
                    ),
                  },
                  {
                    title: t({ id: 'titan.common.status', defaultMessage: '状态' }),
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => {
                      const meta = execStatusMap[status] || { color: 'default', textKey: status, labelKey: status };
                      const icon = statusIconMap[status];
                      return (
                        <Tag color={meta.color} icon={icon}>
                          {t({ id: meta.textKey, defaultMessage: meta.textKey })}
                        </Tag>
                      );
                    },
                  },
                  {
                    title: t({ id: 'titan.dashboard.colTriggerBy', defaultMessage: '触发人' }),
                    dataIndex: 'triggerBy',
                    key: 'triggerBy',
                    render: (val) =>
                      val || t({ id: 'titan.dashboard.defaultTrigger', defaultMessage: '管理员' }),
                  },
                  {
                    title: t({ id: 'titan.dashboard.colStartTime', defaultMessage: '开始时间' }),
                    dataIndex: 'startTime',
                    key: 'startTime',
                    render: (val) => (val ? new Date(val * 1000).toLocaleString() : '-'),
                  },
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <ClusterOutlined style={{ color: '#722ed1' }} />
                  <span>{t({ id: 'titan.dashboard.clustersCard', defaultMessage: '集群就绪状态 (Clusters)' })}</span>
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/clusters')}>
                  {t({ id: 'titan.dashboard.manage', defaultMessage: '管理' })} <ArrowRightOutlined />
                </Button>
              }
              variant="borderless"
            >
              {clusters.length === 0 ? (
                <Empty description={t({ id: 'titan.dashboard.emptyClusters', defaultMessage: '暂无纳管集群' })} />
              ) : (
                <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                  {clusters.slice(0, 5).map((c) => (
                    <Card key={c.id} size="small" variant="borderless" style={{ background: '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Badge status={c.status === 'ACTIVE' ? 'success' : 'error'} />
                          <Text strong>{c.name}</Text>
                        </Space>
                        <Tag color={c.env === 'prod' ? 'red' : 'blue'}>{c.env || 'dev'}</Tag>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                        {c.apiEndpoint || 'https://kubernetes.default.svc'}
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </PageContainer>
  );
};

export default DashboardPage;
