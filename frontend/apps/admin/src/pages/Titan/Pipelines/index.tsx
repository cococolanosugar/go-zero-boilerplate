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
  Select,
  Popconfirm,
  Drawer,
  Typography,
  Card,
  Tooltip,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  BranchesOutlined,
  RocketOutlined,
  AppstoreOutlined,
  EyeOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  devopsListPipelines,
  devopsDeletePipeline,
  devopsTriggerPipeline,
  devopsListExecutions,
  type DevopsListPipelines200ListItem,
  type DevopsListExecutions200ListItem,
} from '@zero/api';
import { DesignerModal } from './DesignerModal';

const { Text } = Typography;

const categoryMetaMap: Record<string, { label: string; color: string }> = {
  microservice: { label: '后端微服务', color: 'blue' },
  frontend: { label: '前端应用', color: 'cyan' },
  data: { label: '数据批处理', color: 'purple' },
  other: { label: '通用流水线', color: 'default' },
};

const execStatusMap: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'default', label: '就绪' },
  RUNNING: { color: 'processing', label: '执行中' },
  WAITING_APPROVAL: { color: 'warning', label: '等待审批' },
  SUCCESS: { color: 'success', label: '发布成功' },
  FAILED: { color: 'error', label: '失败' },
  CANCELLED: { color: 'default', label: '已终止' },
};

export const PipelinesPage: React.FC = () => {
  const { message, notification } = AntdApp.useApp();
  const navigate = useNavigate();
  const actionRef = useRef<ActionType>(null);

  // 设计器弹窗
  const [designerOpen, setDesignerOpen] = useState(false);
  const [designerMode, setDesignerMode] = useState<'create' | 'edit'>('create');
  const [currentPipeline, setCurrentPipeline] = useState<DevopsListPipelines200ListItem | null>(null);

  // 触发运行弹窗
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [triggerPipelineItem, setTriggerPipelineItem] = useState<DevopsListPipelines200ListItem | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerForm] = Form.useForm();

  // 执行历史 Drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyPipelineId, setHistoryPipelineId] = useState<number | undefined>(undefined);
  const historyActionRef = useRef<ActionType>(null);

  // 打开新建设计器
  const handleOpenCreate = () => {
    setDesignerMode('create');
    setCurrentPipeline(null);
    setDesignerOpen(true);
  };

  // 打开编辑设计器
  const handleOpenEdit = (record: DevopsListPipelines200ListItem) => {
    setDesignerMode('edit');
    setCurrentPipeline(record);
    setDesignerOpen(true);
  };

  // 打开触发运行
  const handleOpenTrigger = (record: DevopsListPipelines200ListItem) => {
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

      const res = await devopsTriggerPipeline(triggerPipelineItem.id, {
        gitBranch: values.gitBranch,
        gitCommit: values.gitCommit || '',
        runtimeParams: values.runtimeParams || '{}',
        triggerType: values.triggerType || 'MANUAL',
      });

      message.success(`流水线已启动！执行编号: ${res.execNo}`);
      setTriggerOpen(false);

      // 弹出引导卡片跳转
      notification.info({
        message: 'Titan 流水线已触发运行',
        description: `执行任务 #${res.execNo} 已分派至 Temporal 分布式工作流，可点击下方按钮查看实时日志。`,
        btn: (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              navigate(`/titan/pipelines/exec/${res.execId}`);
              notification.destroy();
            }}
          >
            查看执行进度
          </Button>
        ),
        duration: 8,
      });

      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.message || '触发流水线运行失败');
    } finally {
      setTriggering(false);
    }
  };

  // 打开执行历史 Drawer
  const handleOpenHistory = (pipelineId?: number) => {
    setHistoryPipelineId(pipelineId);
    setHistoryDrawerOpen(true);
    setTimeout(() => {
      historyActionRef.current?.reload();
    }, 100);
  };

  // 删除流水线
  const handleDelete = async (id: number) => {
    try {
      await devopsDeletePipeline(id);
      message.success('流水线已成功删除');
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.message || '删除失败');
    }
  };

  const columns: ProColumns<DevopsListPipelines200ListItem>[] = [
    {
      title: '流水线 ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '流水线名称',
      dataIndex: 'displayName',
      render: (_, record) => (
        <Space vertical size={2}>
          <Space>
            <RocketOutlined style={{ color: '#1677ff' }} />
            <Text strong>{record.displayName || record.name}</Text>
          </Space>
          <Text code style={{ fontSize: 12 }}>
            {record.name}
          </Text>
        </Space>
      ),
    },
    {
      title: '所属分类',
      dataIndex: 'category',
      width: 140,
      valueType: 'select',
      valueEnum: {
        microservice: { text: '后端微服务' },
        frontend: { text: '前端应用' },
        data: { text: '数据批处理' },
        other: { text: '通用流水线' },
      },
      render: (_, record) => {
        const item = categoryMetaMap[record.category || ''] || {
          label: record.category || '其它',
          color: 'default',
        };
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    {
      title: 'Git 仓库 / 分支',
      dataIndex: 'gitRepo',
      search: false,
      render: (_, record) => (
        <Space vertical size={2}>
          <Text ellipsis style={{ maxWidth: 220 }}>
            {record.gitRepo || '-'}
          </Text>
          <Space size={4}>
            <BranchesOutlined style={{ color: '#52c41a' }} />
            <Tag color="green">{record.gitBranch || 'master'}</Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      search: false,
      render: (val) =>
        val === 1 ? <Badge status="success" text="启用" /> : <Badge status="error" text="停用" />,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 170,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 260,
      render: (_, record) => [
        <Button
          key="run"
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => handleOpenTrigger(record)}
        >
          运行
        </Button>,
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenEdit(record)}
        >
          编排
        </Button>,
        <Button
          key="hist"
          type="link"
          size="small"
          icon={<HistoryOutlined />}
          onClick={() => handleOpenHistory(record.id)}
        >
          历史
        </Button>,
        <Popconfirm
          key="del"
          title="确定删除此交付流水线？"
          description="删除后历史构建记录与触发配置将一同清除！"
          onConfirm={() => record.id && handleDelete(record.id)}
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Titan 交付流水线 (Delivery Pipelines)',
        subTitle: '开箱即用的云原生持续构建、容器镜像制作与 Kubernetes 多集群发布编排流水线',
      }}
    >
      <ProTable<DevopsListPipelines200ListItem>
        headerTitle="持续交付流水线定义"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 90 }}
        toolBarRender={() => [
          <Button
            key="all-history"
            icon={<HistoryOutlined />}
            onClick={() => handleOpenHistory(undefined)}
          >
            全局执行大盘
          </Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            新建流水线
          </Button>,
        ]}
        request={async (params) => {
          try {
            const res = await devopsListPipelines({
              category: params.category,
              keyword: params.displayName || params.keyword,
              page: params.current || 1,
              pageSize: params.pageSize || 20,
            });
            return {
              data: res.list || [],
              success: true,
              total: res.total || 0,
            };
          } catch (err: any) {
            message.error(err?.message || '加载流水线列表失败');
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
          message.success('流水线编排已保存生效');
          actionRef.current?.reload();
        }}
      />

      {/* 触发运行弹窗 */}
      <Modal
        title={`启动流水线运行: ${triggerPipelineItem?.displayName || triggerPipelineItem?.name}`}
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
            label="构建检出分支 (Branch)"
            rules={[{ required: true, message: '请输入构建分支' }]}
          >
            <Input placeholder="master, release/v1.0.0, feat/xxx" />
          </Form.Item>

          <Form.Item
            name="gitCommit"
            label="特定 Commit Hash (可选)"
            tooltip="留空表示拉取当前分支 HEAD 最新代码"
          >
            <Input placeholder="例如：7a3c89b (可选)" />
          </Form.Item>

          <Form.Item
            name="runtimeParams"
            label="动态运行时参数 (JSON)"
            tooltip="透传给各个步骤活动的自定义参数字典"
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
            <span>流水线执行历史记录</span>
          </Space>
        }
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        size={880}
      >
        <ProTable<DevopsListExecutions200ListItem>
          actionRef={historyActionRef}
          rowKey="id"
          search={false}
          headerTitle={historyPipelineId ? `流水线 #${historyPipelineId} 执行历史` : '全局最近执行流水'}
          request={async (params) => {
            try {
              const res = await devopsListExecutions({
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
              title: '执行编号',
              dataIndex: 'execNo',
              render: (no, record) => (
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setHistoryDrawerOpen(false);
                    navigate(`/titan/pipelines/exec/${record.id}`);
                  }}
                >
                  #{no || record.id}
                </Button>
              ),
            },
            {
              title: '所属流水线',
              dataIndex: 'pipelineName',
            },
            {
              title: '分支',
              dataIndex: 'gitBranch',
              render: (b) => <Tag color="green">{b || 'master'}</Tag>,
            },
            {
              title: '状态',
              dataIndex: 'status',
              render: (_, record) => {
                const st = (record.status as string) || 'PENDING';
                const meta = execStatusMap[st] || execStatusMap.PENDING;
                return <Tag color={meta.color}>{meta.label}</Tag>;
              },
            },
            {
              title: '耗时',
              dataIndex: 'durationMs',
              render: (ms) => (ms ? `${(Number(ms) / 1000).toFixed(1)}s` : '-'),
            },
            {
              title: '启动时间',
              dataIndex: 'startTime',
            },
            {
              title: '操作',
              valueType: 'option',
              render: (_, record) => [
                <Button
                  key="detail"
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setHistoryDrawerOpen(false);
                    navigate(`/titan/pipelines/exec/${record.id}`);
                  }}
                >
                  查看详情
                </Button>,
              ],
            },
          ]}
        />
      </Drawer>
    </PageContainer>
  );
};

export default PipelinesPage;
