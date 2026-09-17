import React, { useRef, useState } from 'react';
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
  Row,
  Col,
  Statistic,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  ClusterOutlined,
  FolderOpenOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  devopsListClusters,
  devopsCreateCluster,
  devopsUpdateCluster,
  devopsDeleteCluster,
  devopsTestCluster,
  devopsListNamespaces,
  type DevopsListClusters200ListItem,
} from '@zero/api';
import { copyToClipboard } from '@zero/shared';

const { Text, Paragraph } = Typography;

const envTagMap: Record<string, { color: string; label: string }> = {
  dev: { color: 'cyan', label: '开发环境 (dev)' },
  test: { color: 'blue', label: '测试环境 (test)' },
  staging: { color: 'purple', label: '预发环境 (staging)' },
  prod: { color: 'red', label: '生产环境 (prod)' },
};

export const ClustersPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const actionRef = useRef<ActionType>(null);

  // 表单与弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<DevopsListClusters200ListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // 命名空间 Drawer 状态
  const [nsDrawerOpen, setNsDrawerOpen] = useState(false);
  const [currentCluster, setCurrentCluster] = useState<DevopsListClusters200ListItem | null>(null);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [nsLoading, setNsLoading] = useState(false);
  const [nsFilter, setNsFilter] = useState('');

  // 连通性测试 Loading 状态
  const [testingId, setTestingId] = useState<number | null>(null);

  // 打开创建弹窗
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ env: 'dev' });
    setModalOpen(true);
  };

  // 打开编辑弹窗
  const handleOpenEdit = (record: DevopsListClusters200ListItem) => {
    setModalMode('edit');
    setEditingItem(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      env: record.env,
      apiEndpoint: record.apiEndpoint,
      description: record.description,
    });
    setModalOpen(true);
  };

  // 提交创建或修改
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (modalMode === 'create') {
        await devopsCreateCluster({
          name: values.name,
          env: values.env,
          apiEndpoint: values.apiEndpoint || '',
          kubeconfig: values.kubeconfig,
          description: values.description || '',
        });
        message.success('Kubernetes 集群纳管成功');
      } else if (editingItem?.id) {
        await devopsUpdateCluster(editingItem.id, {
          name: values.name,
          env: values.env,
          apiEndpoint: values.apiEndpoint,
          kubeconfig: values.kubeconfig || '',
          description: values.description,
        });
        message.success('集群信息已更新');
      }
      setModalOpen(false);
      actionRef.current?.reload();
    } catch (err: any) {
      if (err?.message) {
        message.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 连通性测试
  const handleTestCluster = async (record: DevopsListClusters200ListItem) => {
    if (!record.id) return;
    setTestingId(record.id);
    try {
      const res = await devopsTestCluster(record.id);
      if (res.success) {
        message.success(`集群 [${record.name}] 连通正常！Kubernetes 版本: ${res.version || 'v1.x'}`);
      } else {
        message.error(`集群连通失败: ${res.message || '网络无法访问'}`);
      }
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.message || '测试连通性异常');
    } finally {
      setTestingId(null);
    }
  };

  // 查看命名空间
  const handleViewNamespaces = async (record: DevopsListClusters200ListItem) => {
    if (!record.id) return;
    setCurrentCluster(record);
    setNsFilter('');
    setNsDrawerOpen(true);
    setNsLoading(true);
    try {
      const res = await devopsListNamespaces(record.id);
      setNamespaces(res.namespaces || []);
    } catch (err: any) {
      message.error(err?.message || '获取命名空间列表失败');
      setNamespaces([]);
    } finally {
      setNsLoading(false);
    }
  };

  // 删除集群
  const handleDelete = async (id: number) => {
    try {
      await devopsDeleteCluster(id);
      message.success('集群已成功注销');
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.message || '删除集群失败');
    }
  };

  const columns: ProColumns<DevopsListClusters200ListItem>[] = [
    {
      title: '集群 ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '集群名称',
      dataIndex: 'name',
      render: (_, record) => (
        <Space vertical size={2}>
          <Space>
            <ClusterOutlined style={{ color: '#1677ff' }} />
            <Text strong>{record.name}</Text>
          </Space>
          {record.description ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: '运行环境',
      dataIndex: 'env',
      width: 140,
      valueType: 'select',
      valueEnum: {
        dev: { text: '开发环境 (dev)' },
        test: { text: '测试环境 (test)' },
        staging: { text: '预发环境 (staging)' },
        prod: { text: '生产环境 (prod)' },
      },
      render: (_, record) => {
        const item = envTagMap[record.env || ''] || { color: 'default', label: record.env || '未知' };
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    {
      title: 'API Server 端点',
      dataIndex: 'apiEndpoint',
      copyable: true,
      ellipsis: true,
      search: false,
      render: (text) => (
        <Tooltip title={text}>
          <Text code copyable>{text || '-'}</Text>
        </Tooltip>
      ),
    },
    {
      title: '健康状态',
      dataIndex: 'status',
      width: 120,
      search: false,
      render: (_, record) => {
        const status = record.status || 'UNKNOWN';
        if (status === 'HEALTHY') {
          return <Badge status="success" text={<Tag color="success">健康 (Healthy)</Tag>} />;
        }
        if (status === 'UNHEALTHY') {
          return <Badge status="error" text={<Tag color="error">异常 (Unhealthy)</Tag>} />;
        }
        return <Badge status="default" text={<Tag color="default">待检测</Tag>} />;
      },
    },
    {
      title: 'K8s 版本',
      dataIndex: 'version',
      width: 110,
      search: false,
      render: (val) => (val ? <Tag color="geekblue">{val}</Tag> : <Text type="secondary">-</Text>),
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
      width: 240,
      render: (_, record) => [
        <Button
          key="test"
          type="link"
          size="small"
          icon={<ThunderboltOutlined />}
          loading={testingId === record.id}
          onClick={() => handleTestCluster(record)}
        >
          连通测试
        </Button>,
        <Button
          key="ns"
          type="link"
          size="small"
          icon={<FolderOpenOutlined />}
          onClick={() => handleViewNamespaces(record)}
        >
          命名空间
        </Button>,
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenEdit(record)}
        >
          编辑
        </Button>,
        <Popconfirm
          key="del"
          title="确定注销此 Kubernetes 集群？"
          description="注销后将无法在此集群部署容器应用或执行 Helm 发布！"
          onConfirm={() => record.id && handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  const filteredNamespaces = namespaces.filter((ns) =>
    ns.toLowerCase().includes(nsFilter.toLowerCase().trim()),
  );

  return (
    <PageContainer
      header={{
        title: 'Titan 集群大盘 (Kubernetes Governance)',
        subTitle: '跨机房、多云多环境 Kubernetes 集群凭证托管、状态探测与资源发布中枢',
      }}
    >
      <ProTable<DevopsListClusters200ListItem>
        headerTitle="已纳管 Kubernetes 集群列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 100,
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            纳管 K8s 集群
          </Button>,
        ]}
        request={async (params) => {
          try {
            const res = await devopsListClusters({
              env: params.env,
              page: params.current || 1,
              pageSize: params.pageSize || 20,
            });
            return {
              data: res.list || [],
              success: true,
              total: res.total || 0,
            };
          } catch (err: any) {
            message.error(err?.message || '加载集群列表失败');
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns}
      />

      {/* 创建 / 编辑集群弹窗 */}
      <Modal
        title={modalMode === 'create' ? '纳管 Kubernetes 集群' : '编辑集群配置'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={680}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="集群标识名称"
            rules={[{ required: true, message: '请输入唯一的集群名称' }]}
            tooltip="例如：k8s-prod-shanghai, test-cluster-01"
          >
            <Input placeholder="输入集群英文/拼音标识，如 prod-aliyun-shanghai" />
          </Form.Item>

          <Form.Item
            name="env"
            label="所属运行环境"
            rules={[{ required: true, message: '请选择环境' }]}
          >
            <Select
              options={[
                { label: '开发环境 (dev)', value: 'dev' },
                { label: '测试环境 (test)', value: 'test' },
                { label: '预发环境 (staging)', value: 'staging' },
                { label: '生产环境 (prod)', value: 'prod' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="apiEndpoint"
            label="Kubernetes API Server 端点 (可选)"
            tooltip="留空时系统将自动从 Kubeconfig 中的 server 字段解析"
          >
            <Input placeholder="https://10.0.0.1:6443" />
          </Form.Item>

          <Form.Item
            name="kubeconfig"
            label="Kubeconfig 凭证内容 (YAML / JSON)"
            rules={modalMode === 'create' ? [{ required: true, message: '请输入 Kubeconfig' }] : []}
            tooltip="Kubeconfig 将使用 AES-GCM 256 位工业级强加密落库存储，仅用于集群通信"
          >
            <Input.TextArea
              rows={8}
              placeholder={
                modalMode === 'create'
                  ? 'apiVersion: v1\nclusters:\n  - cluster:\n      server: https://...\n...'
                  : '留空表示不修改已有 Kubeconfig 凭据'
              }
            />
          </Form.Item>

          <Form.Item name="description" label="备注说明">
            <Input.TextArea rows={2} placeholder="如：阿里云华东二区生产核心 K8s 1.31 集群" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 命名空间 Drawer */}
      <Drawer
        title={
          <Space>
            <FolderOpenOutlined style={{ color: '#1677ff' }} />
            <span>集群命名空间列表: {currentCluster?.name}</span>
          </Space>
        }
        open={nsDrawerOpen}
        onClose={() => setNsDrawerOpen(false)}
        size={420}
      >
        <Input.Search
          placeholder="搜索命名空间..."
          value={nsFilter}
          onChange={(e) => setNsFilter(e.target.value)}
          style={{ marginBottom: 16 }}
          allowClear
        />
        {nsLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>加载中...</div>
        ) : filteredNamespaces.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>未发现命名空间</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredNamespaces.map((ns) => (
              <div
                key={ns}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#fafafa',
                  borderRadius: 6,
                  border: '1px solid #f0f0f0',
                }}
              >
                <Space>
                  <Tag color={ns.startsWith('kube-') ? 'default' : 'geekblue'}>{ns}</Tag>
                  {ns === 'default' ? <Badge status="processing" text="默认" /> : null}
                </Space>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    copyToClipboard(ns);
                    message.success(`已复制命名空间: ${ns}`);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ClustersPage;
