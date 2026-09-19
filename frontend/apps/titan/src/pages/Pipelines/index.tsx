import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  App as AntdApp,
  Button,
  Space,
  Tag,
  Badge,
  Modal,
  Form,
  Input,
  Popconfirm,
  Drawer,
  Typography,
  Divider,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  BranchesOutlined,
  RocketOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  CodeOutlined,
  CloudUploadOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  titanListPipelines,
  titanDeletePipeline,
  titanTriggerPipeline,
  titanListExecutions,
  type TitanListPipelines200ListItem,
  type TitanListExecutions200ListItem,
} from '@zero/api';
import { DesignerModal } from './DesignerModal';
import { ExecutionDetailDrawer } from './ExecutionDetailDrawer';
import { StatusBadge } from '../../components/StatusBadge';
import { jsonValidator } from '../../constants/validation';
import { execStatusMap } from '../../constants/status';
import { useIntl } from '../../contexts/LocaleContext';
import { getErrorMessage } from '../../utils/error';

const { Text } = Typography;

// 分类配色（文案统一走 i18n key：titan.pipelines.category*）
const categoryMetaMap: Record<string, { color: string; key: string }> = {
  microservice: { color: 'blue', key: 'titan.pipelines.categoryMicroservice' },
  frontend: { color: 'cyan', key: 'titan.pipelines.categoryFrontend' },
  data: { color: 'purple', key: 'titan.pipelines.categoryData' },
  other: { color: 'default', key: 'titan.pipelines.categoryOther' },
};

export const PipelinesPage: React.FC = () => {
  const { message, notification } = AntdApp.useApp();
  const navigate = useNavigate();
  const { formatMessage: t } = useIntl();
  const actionRef = useRef<ActionType>(null);

  // 分类过滤
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // 设计器弹窗
  const [designerOpen, setDesignerOpen] = useState(false);
  const [designerMode, setDesignerMode] = useState<'create' | 'edit'>('create');
  const [currentPipeline, setCurrentPipeline] = useState<TitanListPipelines200ListItem | null>(null);

  // 触发运行弹窗
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [triggerPipelineItem, setTriggerPipelineItem] = useState<TitanListPipelines200ListItem | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerForm] = Form.useForm();

  // 执行历史 Drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyPipelineId, setHistoryPipelineId] = useState<number | undefined>(undefined);
  const historyActionRef = useRef<ActionType>(null);
  const [detailDrawerExecId, setDetailDrawerExecId] = useState<number | null>(null);

  // 打开新建设计器
  const handleOpenCreate = () => {
    setDesignerMode('create');
    setCurrentPipeline(null);
    setDesignerOpen(true);
  };

  // 打开编辑设计器
  const handleOpenEdit = (record: TitanListPipelines200ListItem) => {
    setDesignerMode('edit');
    setCurrentPipeline(record);
    setDesignerOpen(true);
  };

  // 打开触发运行
  const handleOpenTrigger = (record: TitanListPipelines200ListItem) => {
    setTriggerPipelineItem(record);
    triggerForm.resetFields();
    triggerForm.setFieldsValue({
      gitBranch: record.gitBranch || 'master',
      triggerType: 'MANUAL',
      runtimeParams: '{}',
    });
    setTriggerOpen(true);
  };

  // 提交触发
  const handleConfirmTrigger = async () => {
    try {
      const values = await triggerForm.validateFields();
      if (!triggerPipelineItem?.id) return;
      setTriggering(true);

      const res = await titanTriggerPipeline(triggerPipelineItem.id, {
        gitBranch: values.gitBranch,
        gitCommit: values.gitCommit || '',
        runtimeParams: values.runtimeParams || '{}',
        triggerType: values.triggerType || 'MANUAL',
      });

      message.success(
        t({ id: 'titan.pipelines.triggerSuccess', defaultMessage: '流水线已启动！执行编号: {execNo}' }, { execNo: res.execNo })
      );
      setTriggerOpen(false);

      // 弹出引导卡片跳转
      notification.info({
        message: t({ id: 'titan.pipelines.notificationTitle', defaultMessage: 'Titan 流水线已触发运行' }),
        description: t(
          {
            id: 'titan.pipelines.notificationDesc',
            defaultMessage: '执行任务 #{execNo} 已分派至 Temporal 分布式工作流，可点击下方按钮查看实时日志。',
          },
          { execNo: res.execNo }
        ),
        btn: (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setDetailDrawerExecId(res.execId ?? null);
              notification.destroy();
            }}
          >
            {t({ id: 'titan.pipelines.viewProgress', defaultMessage: '查看执行进度' })}
          </Button>
        ),
        duration: 8,
      });

      actionRef.current?.reload();
    } catch (err) {
      message.error(getErrorMessage(err, t({ id: 'titan.pipelines.triggerFailed', defaultMessage: '触发流水线运行失败' })));
    } finally {
      setTriggering(false);
    }
  };

  // 打开执行历史 Drawer（ProTable reload 同步安全，微任务内触发即可，无需 setTimeout hack）
  const handleOpenHistory = (pipelineId?: number) => {
    setHistoryPipelineId(pipelineId);
    setHistoryDrawerOpen(true);
    void Promise.resolve().then(() => historyActionRef.current?.reload());
  };

  // 删除流水线
  const handleDelete = async (id: number) => {
    try {
      await titanDeletePipeline(id);
      message.success(t({ id: 'titan.pipelines.deleteSuccess', defaultMessage: '流水线已成功删除' }));
      actionRef.current?.reload();
    } catch (err) {
      message.error(getErrorMessage(err, t({ id: 'titan.common.deleteFailed', defaultMessage: '删除失败' })));
    }
  };

  // 渲染 Zadig 标志性阶段视觉流程图
  const renderStagesFlow = (category?: string) => {
    if (category === 'frontend') {
      return (
        <Space size={4} wrap>
          <Tag color="blue" icon={<CodeOutlined />}>{t({ id: 'titan.pipelines.flowCheckout', defaultMessage: '检出' })}</Tag>
          <ArrowRightOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
          <Tag color="geekblue" icon={<RocketOutlined />}>{t({ id: 'titan.pipelines.flowNodeBuild', defaultMessage: 'Node构建' })}</Tag>
          <ArrowRightOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
          <Tag color="green" icon={<CloudUploadOutlined />}>{t({ id: 'titan.pipelines.flowCdnDeploy', defaultMessage: 'CDN发布' })}</Tag>
        </Space>
      );
    }
    if (category === 'data') {
      return (
        <Space size={4} wrap>
          <Tag color="purple" icon={<CodeOutlined />}>{t({ id: 'titan.pipelines.flowDataSync', defaultMessage: '数据同步' })}</Tag>
          <ArrowRightOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
          <Tag color="geekblue" icon={<SyncOutlined />}>{t({ id: 'titan.pipelines.flowCompute', defaultMessage: '计算流' })}</Tag>
          <ArrowRightOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
          <Tag color="green" icon={<SafetyCertificateOutlined />}>{t({ id: 'titan.pipelines.flowVerify', defaultMessage: '校验归档' })}</Tag>
        </Space>
      );
    }
    // Default / microservice
    return (
      <Space size={4} wrap>
        <Tag color="blue" icon={<CodeOutlined />}>{t({ id: 'titan.pipelines.flowCodeCheckout', defaultMessage: '代码检出' })}</Tag>
        <ArrowRightOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
        <Tag color="cyan" icon={<RocketOutlined />}>{t({ id: 'titan.pipelines.flowDockerBuild', defaultMessage: 'Docker构建' })}</Tag>
        <ArrowRightOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
        <Tag color="green" icon={<CloudUploadOutlined />}>{t({ id: 'titan.pipelines.flowK8sDeploy', defaultMessage: 'K8s交付' })}</Tag>
      </Space>
    );
  };

  const columns: ProColumns<TitanListPipelines200ListItem>[] = [
    {
      title: t({ id: 'titan.pipelines.colName', defaultMessage: '流水线名称' }),
      dataIndex: 'displayName',
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <RocketOutlined style={{ color: '#1677ff', fontSize: 16 }} />
            <Text strong style={{ fontSize: 14 }}>{record.displayName || record.name}</Text>
          </Space>
          <Text code style={{ fontSize: 11 }}>
            {record.name}
          </Text>
        </Space>
      ),
    },
    {
      title: t({ id: 'titan.pipelines.colCategory', defaultMessage: '工作流类型' }),
      dataIndex: 'category',
      width: 120,
      valueType: 'select',
      valueEnum: {
        microservice: { text: t({ id: 'titan.pipelines.categoryMicroservice', defaultMessage: '后端微服务' }) },
        frontend: { text: t({ id: 'titan.pipelines.categoryFrontend', defaultMessage: '前端应用' }) },
        data: { text: t({ id: 'titan.pipelines.categoryData', defaultMessage: '数据批处理' }) },
        other: { text: t({ id: 'titan.pipelines.categoryOther', defaultMessage: '通用工作流' }) },
      },
      render: (_, record) => {
        const item = categoryMetaMap[record.category || ''] || {
          color: 'default',
          key: '',
        };
        return (
          <Tag color={item.color}>
            {item.key
              ? t({ id: item.key, defaultMessage: record.category || '' })
              : t({ id: 'titan.pipelines.categoryFallback', defaultMessage: '通用' })}
          </Tag>
        );
      },
    },
    {
      title: t({ id: 'titan.pipelines.colStages', defaultMessage: '阶段编排流 (Stages Flow)' }),
      dataIndex: 'category',
      search: false,
      width: 300,
      render: (_, record) => renderStagesFlow(record.category),
    },
    {
      title: t({ id: 'titan.pipelines.colGitRepo', defaultMessage: 'Git 仓库 / 分支' }),
      dataIndex: 'gitRepo',
      search: false,
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Text ellipsis style={{ maxWidth: 200, fontSize: 12 }}>
            {record.gitRepo || '-'}
          </Text>
          <Space size={4}>
            <BranchesOutlined style={{ color: '#52c41a' }} />
            <Tag color="green">{record.gitBranch || 'main'}</Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: t({ id: 'titan.pipelines.colStatus', defaultMessage: '运行状态' }),
      dataIndex: 'status',
      width: 90,
      search: false,
      render: (val) =>
        val === 1 ? (
          <Badge status="success" text={t({ id: 'titan.pipelines.statusActive', defaultMessage: '活跃' })} />
        ) : (
          <Badge status="error" text={t({ id: 'titan.pipelines.statusInactive', defaultMessage: '停用' })} />
        ),
    },
    {
      title: t({ id: 'titan.common.updateTime', defaultMessage: '更新时间' }),
      dataIndex: 'updateTime',
      width: 160,
      search: false,
      render: (time) => <Text type="secondary" style={{ fontSize: 12 }}>{time || '-'}</Text>,
    },
    {
      title: t({ id: 'titan.common.action', defaultMessage: '操作' }),
      valueType: 'option',
      width: 240,
      render: (_, record) => [
        <Button
          key="run"
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          style={{ background: '#52c41a', borderColor: '#52c41a' }}
          onClick={() => handleOpenTrigger(record)}
        >
          {t({ id: 'titan.pipelines.run', defaultMessage: '启动' })}
        </Button>,
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenEdit(record)}
        >
          {t({ id: 'titan.pipelines.orchestrate', defaultMessage: '编排' })}
        </Button>,
        <Button
          key="hist"
          type="link"
          size="small"
          icon={<HistoryOutlined />}
          onClick={() => handleOpenHistory(record.id)}
        >
          {t({ id: 'titan.pipelines.history', defaultMessage: '历史' })}
        </Button>,
        <Popconfirm
          key="del"
          title={t({ id: 'titan.pipelines.deleteConfirmTitle', defaultMessage: '确定删除此交付流水线？' })}
          description={t({ id: 'titan.pipelines.deleteConfirmDesc', defaultMessage: '删除后历史构建记录与触发配置将一同清除！' })}
          onConfirm={() => record.id && handleDelete(record.id)}
          okText={t({ id: 'titan.common.ok', defaultMessage: '确定' })}
          cancelText={t({ id: 'titan.common.cancel', defaultMessage: '取消' })}
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            {t({ id: 'titan.common.delete', defaultMessage: '删除' })}
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: t({ id: 'titan.pipelines.title', defaultMessage: '交付流水线 (Delivery Pipelines)' }),
        subTitle: t({
          id: 'titan.pipelines.subTitle',
          defaultMessage: '对齐 Zadig 自动化工作流：支持后端微服务、前端应用与数据作业的阶段 DAG 编排与自动化分发',
        }),
      }}
    >
      {/* Zadig 标志性分类 Tabs */}
      <Tabs
        activeKey={activeCategory}
        onChange={(key) => {
          setActiveCategory(key);
          actionRef.current?.reload();
        }}
        items={[
          { key: 'all', label: t({ id: 'titan.pipelines.tabAll', defaultMessage: '全部工作流 (All)' }) },
          { key: 'microservice', label: t({ id: 'titan.pipelines.tabMicroservice', defaultMessage: '后端微服务 (Microservices)' }) },
          { key: 'frontend', label: t({ id: 'titan.pipelines.tabFrontend', defaultMessage: '前端持续交付 (Frontend)' }) },
          { key: 'data', label: t({ id: 'titan.pipelines.tabData', defaultMessage: '数据与批处理 (Data & Batch)' }) },
        ]}
        style={{ marginBottom: 12 }}
      />

      <ProTable<TitanListPipelines200ListItem>
        actionRef={actionRef}
        rowKey="id"
        size="small"
        search={{ labelWidth: 90 }}
        toolBarRender={() => [
          <Button
            key="all-history"
            icon={<HistoryOutlined />}
            onClick={() => handleOpenHistory(undefined)}
          >
            {t({ id: 'titan.pipelines.globalHistory', defaultMessage: '全局执行大盘' })}
          </Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            {t({ id: 'titan.pipelines.create', defaultMessage: '新建流水线' })}
          </Button>,
        ]}
        request={async (params) => {
          try {
            const categoryFilter =
              activeCategory !== 'all' ? activeCategory : params.category;
            const res = await titanListPipelines({
              category: categoryFilter,
              keyword: params.displayName || params.keyword,
              page: params.current || 1,
              pageSize: params.pageSize || 20,
            });
            return {
              data: res.list || [],
              success: true,
              total: res.total || 0,
            };
          } catch (err) {
            message.error(getErrorMessage(err, t({ id: 'titan.pipelines.loadFailed', defaultMessage: '加载流水线列表失败' })));
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns}
      />

      {/* 可视化编排设计器弹窗 */}
      <DesignerModal
        open={designerOpen}
        mode={designerMode}
        pipeline={currentPipeline}
        onClose={() => setDesignerOpen(false)}
        onSuccess={() => {
          setDesignerOpen(false);
          message.success(t({ id: 'titan.pipelines.saveSuccess', defaultMessage: '流水线编排已保存生效' }));
          actionRef.current?.reload();
        }}
      />

      {/* 触发运行弹窗 */}
      <Modal
        title={t(
          { id: 'titan.pipelines.triggerModalTitle', defaultMessage: '启动流水线运行: {name}' },
          { name: triggerPipelineItem?.displayName || triggerPipelineItem?.name }
        )}
        open={triggerOpen}
        onCancel={() => setTriggerOpen(false)}
        onOk={handleConfirmTrigger}
        confirmLoading={triggering}
        width={540}
        destroyOnHidden
      >
        <Form form={triggerForm} layout="vertical" preserve={false}>
          <Form.Item
            name="gitBranch"
            label={t({ id: 'titan.pipelines.labelBranch', defaultMessage: '构建检出分支 (Branch)' })}
            rules={[{ required: true, message: t({ id: 'titan.pipelines.ruleBranch', defaultMessage: '请输入构建分支' }) }]}
          >
            <Input placeholder="master, release/v1.0.0, feat/xxx" />
          </Form.Item>

          <Form.Item
            name="gitCommit"
            label={t({ id: 'titan.pipelines.labelCommit', defaultMessage: '特定 Commit Hash (可选)' })}
            tooltip={t({ id: 'titan.pipelines.labelCommitTooltip', defaultMessage: '留空表示拉取当前分支 HEAD 最新代码' })}
          >
            <Input placeholder={t({ id: 'titan.pipelines.placeholderCommit', defaultMessage: '例如：7a3c89b (可选)' })} />
          </Form.Item>

          <Form.Item
            name="runtimeParams"
            label={t({ id: 'titan.pipelines.labelRuntimeParams', defaultMessage: '动态运行时参数 (JSON)' })}
            tooltip={t({ id: 'titan.pipelines.labelParamsTooltip', defaultMessage: '透传给各个步骤活动的自定义参数字典' })}
            rules={[{ validator: jsonValidator }]}
          >
            <Input.TextArea rows={3} placeholder='{"ENV": "test", "REPLICAS": 2}' />
          </Form.Item>
        </Form>
      </Modal>

      {/* 执行历史记录 Drawer */}
      <Drawer
        title={
          <Space>
            <HistoryOutlined style={{ color: '#1677ff' }} />
            <span>{t({ id: 'titan.pipelines.historyDrawerTitle', defaultMessage: '流水线执行历史记录' })}</span>
          </Space>
        }
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        size={880}
      >
        <ProTable<TitanListExecutions200ListItem>
          actionRef={historyActionRef}
          rowKey="id"
          search={false}
          headerTitle={
            historyPipelineId
              ? t({ id: 'titan.pipelines.historyTitle', defaultMessage: '流水线 #{id} 执行历史' }, { id: historyPipelineId })
              : t({ id: 'titan.pipelines.globalHistoryTitle', defaultMessage: '全局最近执行流水' })
          }
          request={async (params) => {
            try {
              const res = await titanListExecutions({
                pipelineId: historyPipelineId,
                page: params.current || 1,
                pageSize: params.pageSize || 20,
              });
              return {
                data: res.list || [],
                success: true,
                total: res.total || 0,
              };
            } catch {
              return { data: [], success: false, total: 0 };
            }
          }}
          columns={[
            {
              title: t({ id: 'titan.pipelines.colExecNo', defaultMessage: '执行编号' }),
              dataIndex: 'execNo',
              render: (no, record) => (
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setDetailDrawerExecId(record.id);
                  }}
                >
                  #{no || record.id}
                </Button>
              ),
            },
            {
              title: t({ id: 'titan.pipelines.colPipeline', defaultMessage: '所属流水线' }),
              dataIndex: 'pipelineName',
            },
            {
              title: t({ id: 'titan.pipelines.colBranch', defaultMessage: '分支' }),
              dataIndex: 'gitBranch',
              render: (b) => <Tag color="green">{b || 'master'}</Tag>,
            },
            {
              title: t({ id: 'titan.common.status', defaultMessage: '状态' }),
              dataIndex: 'status',
              render: (_, record) => <StatusBadge status={record.status || 'PENDING'} />,
            },
            {
              title: t({ id: 'titan.pipelines.colDuration', defaultMessage: '耗时' }),
              dataIndex: 'durationMs',
              render: (ms) => (ms ? `${(Number(ms) / 1000).toFixed(1)}s` : '-'),
            },
            {
              title: t({ id: 'titan.pipelines.colStartTime', defaultMessage: '启动时间' }),
              dataIndex: 'startTime',
            },
            {
              title: t({ id: 'titan.common.action', defaultMessage: '操作' }),
              valueType: 'option',
              render: (_, record) => [
                <Button
                  key="detail"
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setDetailDrawerExecId(record.id);
                  }}
                >
                  {t({ id: 'titan.pipelines.viewDetail', defaultMessage: '查看详情' })}
                </Button>,
              ],
            },
          ]}
        />
      </Drawer>

      {/* 720px 流水线执行详情与实时日志抽屉 (Drawer-First UX) */}
      <ExecutionDetailDrawer
        open={detailDrawerExecId !== null}
        execId={detailDrawerExecId}
        onClose={() => setDetailDrawerExecId(null)}
      />
    </PageContainer>
  );
};

export default PipelinesPage;
