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
  titanListClusters,
  titanCreateCluster,
  titanUpdateCluster,
  titanDeleteCluster,
  titanTestCluster,
  titanListNamespaces,
  type TitanListClusters200ListItem,
} from '@zero/api';
import { copyToClipboard } from '@zero/shared';
import { urlValidator } from '../../constants/validation';
import { useIntl } from '../../contexts/LocaleContext';
import { getErrorMessage } from '../../utils/error';

const { Text } = Typography;

// 环境配色（文案统一走 i18n key：titan.clusters.env*）
const envTagColorMap: Record<string, string> = {
  dev: 'cyan',
  test: 'blue',
  staging: 'purple',
  prod: 'red',
};

export const ClustersPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage: t } = useIntl();
  const actionRef = useRef<ActionType>(null);

  // 表单与弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<TitanListClusters200ListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // 命名空间 Drawer 状态
  const [nsDrawerOpen, setNsDrawerOpen] = useState(false);
  const [currentCluster, setCurrentCluster] = useState<TitanListClusters200ListItem | null>(null);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [nsLoading, setNsLoading] = useState(false);
  const [nsFilter, setNsFilter] = useState('');

  // 连通性测试 Loading 状态
  const [testingId, setTestingId] = useState<number | null>(null);

  const envLabel = (env?: string) => {
    const keyMap: Record<string, string> = {
      dev: 'titan.clusters.envDev',
      test: 'titan.clusters.envTest',
      staging: 'titan.clusters.envStaging',
      prod: 'titan.clusters.envProd',
    };
    const key = keyMap[env || ''];
    return key
      ? t({ id: key, defaultMessage: env! })
      : t({ id: 'titan.clusters.envUnknown', defaultMessage: '未知' });
  };

  // 打开创建弹窗
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ env: 'dev' });
    setModalOpen(true);
  };

  // 打开编辑弹窗
  const handleOpenEdit = (record: TitanListClusters200ListItem) => {
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
        await titanCreateCluster({
          name: values.name,
          env: values.env,
          apiEndpoint: values.apiEndpoint || '',
          kubeconfig: values.kubeconfig,
          description: values.description || '',
        });
        message.success(t({ id: 'titan.clusters.createSuccess', defaultMessage: 'Kubernetes 集群纳管成功' }));
      } else if (editingItem?.id) {
        await titanUpdateCluster(editingItem.id, {
          name: values.name,
          env: values.env,
          apiEndpoint: values.apiEndpoint,
          kubeconfig: values.kubeconfig || '',
          description: values.description,
        });
        message.success(t({ id: 'titan.clusters.updateSuccess', defaultMessage: '集群信息已更新' }));
      }
      setModalOpen(false);
      actionRef.current?.reload();
    } catch (err) {
      const errMsg = getErrorMessage(err, '');
      if (errMsg) {
        message.error(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 连通性测试
  const handleTestCluster = async (record: TitanListClusters200ListItem) => {
    if (!record.id) return;
    setTestingId(record.id);
    try {
      const res = await titanTestCluster(record.id);
      if (res.success) {
        message.success(
          t(
            { id: 'titan.clusters.testSuccess', defaultMessage: '集群 [{name}] 连通正常！Kubernetes 版本: {version}' },
            { name: record.name, version: res.version || 'v1.x' }
          )
        );
      } else {
        message.error(
          t(
            { id: 'titan.clusters.testFailed', defaultMessage: '集群连通失败: {message}' },
            { message: res.message || t({ id: 'titan.clusters.unreachable', defaultMessage: '网络无法访问' }) }
          )
        );
      }
      actionRef.current?.reload();
    } catch (err) {
      message.error(getErrorMessage(err, t({ id: 'titan.clusters.testError', defaultMessage: '测试连通性异常' })));
    } finally {
      setTestingId(null);
    }
  };

  // 查看命名空间
  const handleViewNamespaces = async (record: TitanListClusters200ListItem) => {
    if (!record.id) return;
    setCurrentCluster(record);
    setNsFilter('');
    setNsDrawerOpen(true);
    setNsLoading(true);
    try {
      const res = await titanListNamespaces(record.id);
      setNamespaces(res.namespaces || []);
    } catch (err) {
      message.error(getErrorMessage(err, t({ id: 'titan.clusters.nsLoadFailed', defaultMessage: '获取命名空间列表失败' })));
      setNamespaces([]);
    } finally {
      setNsLoading(false);
    }
  };

  // 删除集群
  const handleDelete = async (id: number) => {
    try {
      await titanDeleteCluster(id);
      message.success(t({ id: 'titan.clusters.deleteSuccess', defaultMessage: '集群已成功注销' }));
      actionRef.current?.reload();
    } catch (err) {
      message.error(getErrorMessage(err, t({ id: 'titan.clusters.deleteFailed', defaultMessage: '删除集群失败' })));
    }
  };

  const columns: ProColumns<TitanListClusters200ListItem>[] = [
    {
      title: t({ id: 'titan.clusters.colId', defaultMessage: '集群 ID' }),
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: t({ id: 'titan.clusters.colName', defaultMessage: '集群名称' }),
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
      title: t({ id: 'titan.clusters.colEnv', defaultMessage: '运行环境' }),
      dataIndex: 'env',
      width: 140,
      valueType: 'select',
      valueEnum: {
        dev: { text: t({ id: 'titan.clusters.envDev', defaultMessage: '开发环境 (dev)' }) },
        test: { text: t({ id: 'titan.clusters.envTest', defaultMessage: '测试环境 (test)' }) },
        staging: { text: t({ id: 'titan.clusters.envStaging', defaultMessage: '预发环境 (staging)' }) },
        prod: { text: t({ id: 'titan.clusters.envProd', defaultMessage: '生产环境 (prod)' }) },
      },
      render: (_, record) => (
        <Tag color={envTagColorMap[record.env || ''] || 'default'}>{envLabel(record.env)}</Tag>
      ),
    },
    {
      title: t({ id: 'titan.clusters.colEndpoint', defaultMessage: 'API Server 端点' }),
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
      title: t({ id: 'titan.clusters.colHealth', defaultMessage: '健康状态' }),
      dataIndex: 'status',
      width: 120,
      search: false,
      render: (_, record) => {
        const status = record.status || 'UNKNOWN';
        if (status === 'HEALTHY') {
          return (
            <Badge
              status="success"
              text={<Tag color="success">{t({ id: 'titan.clusters.healthHealthy', defaultMessage: '健康 (Healthy)' })}</Tag>}
            />
          );
        }
        if (status === 'UNHEALTHY') {
          return (
            <Badge
              status="error"
              text={<Tag color="error">{t({ id: 'titan.clusters.healthUnhealthy', defaultMessage: '异常 (Unhealthy)' })}</Tag>}
            />
          );
        }
        return (
          <Badge status="default" text={<Tag color="default">{t({ id: 'titan.clusters.healthPending', defaultMessage: '待检测' })}</Tag>} />
        );
      },
    },
    {
      title: t({ id: 'titan.clusters.colVersion', defaultMessage: 'K8s 版本' }),
      dataIndex: 'version',
      width: 110,
      search: false,
      render: (val) => (val ? <Tag color="geekblue">{val}</Tag> : <Text type="secondary">-</Text>),
    },
    {
      title: t({ id: 'titan.common.updateTime', defaultMessage: '更新时间' }),
      dataIndex: 'updateTime',
      width: 170,
      search: false,
    },
    {
      title: t({ id: 'titan.common.action', defaultMessage: '操作' }),
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
          {t({ id: 'titan.clusters.test', defaultMessage: '连通测试' })}
        </Button>,
        <Button
          key="ns"
          type="link"
          size="small"
          icon={<FolderOpenOutlined />}
          onClick={() => handleViewNamespaces(record)}
        >
          {t({ id: 'titan.clusters.namespaces', defaultMessage: '命名空间' })}
        </Button>,
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenEdit(record)}
        >
          {t({ id: 'titan.common.edit', defaultMessage: '编辑' })}
        </Button>,
        <Popconfirm
          key="del"
          title={t({ id: 'titan.clusters.deleteConfirmTitle', defaultMessage: '确定注销此 Kubernetes 集群？' })}
          description={t({ id: 'titan.clusters.deleteConfirmDesc', defaultMessage: '注销后将无法在此集群部署容器应用或执行 Helm 发布！' })}
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

  const filteredNamespaces = namespaces.filter((ns) =>
    ns.toLowerCase().includes(nsFilter.toLowerCase().trim()),
  );

  return (
    <PageContainer
      header={{
        title: t({ id: 'titan.clusters.title', defaultMessage: 'Titan 集群大盘 (Kubernetes Governance)' }),
        subTitle: t({
          id: 'titan.clusters.subTitle',
          defaultMessage: '跨机房、多云多环境 Kubernetes 集群凭证托管、状态探测与资源发布中枢',
        }),
      }}
    >
      <ProTable<TitanListClusters200ListItem>
        headerTitle={t({ id: 'titan.clusters.headerTitle', defaultMessage: '已纳管 Kubernetes 集群列表' })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 100,
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            {t({ id: 'titan.clusters.addAction', defaultMessage: '纳管 K8s 集群' })}
          </Button>,
        ]}
        request={async (params) => {
          try {
            const res = await titanListClusters({
              env: params.env,
              page: params.current || 1,
              pageSize: params.pageSize || 20,
            });
            return {
              data: res.list || [],
              success: true,
              total: res.total || 0,
            };
          } catch (err) {
            message.error(getErrorMessage(err, t({ id: 'titan.clusters.loadFailed', defaultMessage: '加载集群列表失败' })));
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns}
      />

      {/* 创建 / 编辑集群弹窗 */}
      <Modal
        title={
          modalMode === 'create'
            ? t({ id: 'titan.clusters.modalCreateTitle', defaultMessage: '纳管 Kubernetes 集群' })
            : t({ id: 'titan.clusters.modalEditTitle', defaultMessage: '编辑集群配置' })
        }
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
            label={t({ id: 'titan.clusters.labelName', defaultMessage: '集群标识名称' })}
            rules={[{ required: true, message: t({ id: 'titan.clusters.ruleName', defaultMessage: '请输入唯一的集群名称' }) }]}
            tooltip={t({ id: 'titan.clusters.labelNameTooltip', defaultMessage: '例如：k8s-prod-shanghai, test-cluster-01' })}
          >
            <Input placeholder={t({ id: 'titan.clusters.placeholderName', defaultMessage: '输入集群英文/拼音标识，如 prod-aliyun-shanghai' })} />
          </Form.Item>

          <Form.Item
            name="env"
            label={t({ id: 'titan.clusters.labelEnv', defaultMessage: '所属运行环境' })}
            rules={[{ required: true, message: t({ id: 'titan.clusters.ruleEnv', defaultMessage: '请选择环境' }) }]}
          >
            <Select
              options={[
                { label: t({ id: 'titan.clusters.envDev', defaultMessage: '开发环境 (dev)' }), value: 'dev' },
                { label: t({ id: 'titan.clusters.envTest', defaultMessage: '测试环境 (test)' }), value: 'test' },
                { label: t({ id: 'titan.clusters.envStaging', defaultMessage: '预发环境 (staging)' }), value: 'staging' },
                { label: t({ id: 'titan.clusters.envProd', defaultMessage: '生产环境 (prod)' }), value: 'prod' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="apiEndpoint"
            label={t({ id: 'titan.clusters.labelEndpoint', defaultMessage: 'Kubernetes API Server 端点 (可选)' })}
            tooltip={t({ id: 'titan.clusters.labelEndpointTooltip', defaultMessage: '留空时系统将自动从 Kubeconfig 中的 server 字段解析' })}
            rules={[{ validator: urlValidator }]}
          >
            <Input placeholder="https://10.0.0.1:6443" />
          </Form.Item>

          <Form.Item
            name="kubeconfig"
            label={t({ id: 'titan.clusters.labelKubeconfig', defaultMessage: 'Kubeconfig 凭证内容 (YAML / JSON)' })}
            rules={modalMode === 'create' ? [{ required: true, message: t({ id: 'titan.clusters.ruleKubeconfig', defaultMessage: '请输入 Kubeconfig' }) }] : []}
            tooltip={t({
              id: 'titan.clusters.labelKubeconfigTooltip',
              defaultMessage: 'Kubeconfig 将使用 AES-GCM 256 位工业级强加密落库存储，仅用于集群通信',
            })}
          >
            <Input.TextArea
              rows={8}
              placeholder={
                modalMode === 'create'
                  ? 'apiVersion: v1\nclusters:\n  - cluster:\n      server: https://...\n...'
                  : t({ id: 'titan.clusters.kubeconfigEditPlaceholder', defaultMessage: '留空表示不修改已有 Kubeconfig 凭据' })
              }
            />
          </Form.Item>

          <Form.Item name="description" label={t({ id: 'titan.common.description', defaultMessage: '备注说明' })}>
            <Input.TextArea rows={2} placeholder={t({ id: 'titan.clusters.placeholderDescription', defaultMessage: '如：阿里云华东二区生产核心 K8s 1.31 集群' })} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 命名空间 Drawer */}
      <Drawer
        title={
          <Space>
            <FolderOpenOutlined style={{ color: '#1677ff' }} />
            <span>
              {t(
                { id: 'titan.clusters.nsDrawerTitle', defaultMessage: '集群命名空间列表: {name}' },
                { name: currentCluster?.name }
              )}
            </span>
          </Space>
        }
        open={nsDrawerOpen}
        onClose={() => setNsDrawerOpen(false)}
        size={420}
      >
        <Input.Search
          placeholder={t({ id: 'titan.clusters.nsSearchPlaceholder', defaultMessage: '搜索命名空间...' })}
          value={nsFilter}
          onChange={(e) => setNsFilter(e.target.value)}
          style={{ marginBottom: 16 }}
          allowClear
        />
        {nsLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            {t({ id: 'titan.clusters.loading', defaultMessage: '加载中...' })}
          </div>
        ) : filteredNamespaces.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
            {t({ id: 'titan.clusters.nsEmpty', defaultMessage: '未发现命名空间' })}
          </div>
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
                  {ns === 'default' ? (
                    <Badge status="processing" text={t({ id: 'titan.clusters.nsDefault', defaultMessage: '默认' })} />
                  ) : null}
                </Space>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    copyToClipboard(ns);
                    message.success(
                      t({ id: 'titan.clusters.nsCopied', defaultMessage: '已复制命名空间: {ns}' }, { ns })
                    );
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
