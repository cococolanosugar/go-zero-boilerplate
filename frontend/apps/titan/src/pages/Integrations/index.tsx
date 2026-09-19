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
  Typography,
  Card,
  Tooltip,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
  GithubOutlined,
  CodeOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  ApartmentOutlined,
  SettingOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  titanListIntegrations,
  titanCreateIntegration,
  titanUpdateIntegration,
  titanDeleteIntegration,
  titanTestIntegration,
  type TitanListIntegrations200ListItem,
} from '@zero/api';

const { Text } = Typography;

const categoryMetaMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NACOS: { label: 'Nacos 配置与注册中心', color: 'cyan', icon: <ApartmentOutlined /> },
  APOLLO: { label: 'Apollo 分布式配置中心', color: 'magenta', icon: <SettingOutlined /> },
  JENKINS: { label: 'Jenkins CI', color: 'blue', icon: <ApiOutlined /> },
  GIT: { label: 'Git 仓库 (GitLab/GitHub)', color: 'green', icon: <GithubOutlined /> },
  REGISTRY: { label: '镜像仓库 (Harbor/Docker)', color: 'orange', icon: <DatabaseOutlined /> },
  HARBOR: { label: 'Harbor 镜像仓库', color: 'orange', icon: <DatabaseOutlined /> },
  SONAR: { label: '代码扫描 (SonarQube)', color: 'purple', icon: <CodeOutlined /> },
};

const getCategoryMeta = (category?: string) => {
  const key = (category || '').toUpperCase();
  return categoryMetaMap[key] || {
    label: category || '其它',
    color: 'default',
    icon: <ApiOutlined />,
  };
};

const getConfigPlaceholder = (category: string) => {
  const cat = (category || '').toUpperCase();
  switch (cat) {
    case 'NACOS':
      return '{\n  "serverAddr": "127.0.0.1:8848",\n  "namespace": "public",\n  "group": "DEFAULT_GROUP",\n  "contextPath": "/nacos"\n}';
    case 'APOLLO':
      return '{\n  "portalUrl": "http://apollo-portal.internal.net",\n  "metaServer": "http://10.0.0.15:8080",\n  "appId": "titan-app",\n  "cluster": "default",\n  "env": "DEV",\n  "token": "apollo-token-xxxx"\n}';
    case 'JENKINS':
      return '{\n  "url": "http://10.0.0.10:8080",\n  "username": "admin",\n  "apiToken": "11xxxxxx"\n}';
    case 'REGISTRY':
    case 'HARBOR':
      return '{\n  "url": "harbor.internal.net",\n  "username": "robot$deploy",\n  "password": "SecretPassword"\n}';
    case 'SONAR':
      return '{\n  "url": "https://sonar.internal.net",\n  "token": "sqa_xxxxxxxx"\n}';
    default:
      return '{\n  "url": "https://gitlab.internal.net",\n  "token": "glpat-xxxxxxxx"\n}';
  }
};

export const IntegrationsPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const actionRef = useRef<ActionType>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<TitanListIntegrations200ListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);

  const [form] = Form.useForm();
  const selectedCategory = Form.useWatch('category', form) || 'NACOS';

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      category: 'NACOS',
      authType: 'NONE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (record: TitanListIntegrations200ListItem) => {
    setModalMode('edit');
    setEditingItem(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      category: (record.category || '').toUpperCase(),
      authType: (record.authType || 'TOKEN').toUpperCase(),
      config: record.config,
      status: record.status,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 组装 config JSON 字符串
      let configStr = values.config || '{}';
      if (typeof values.config === 'object') {
        configStr = JSON.stringify(values.config);
      }

      if (modalMode === 'create') {
        await titanCreateIntegration({
          name: values.name,
          category: (values.category || '').toUpperCase(),
          authType: values.authType,
          config: configStr,
          description: values.description || '',
        });
        message.success('第三方集成凭证已成功纳管');
      } else if (editingItem?.id) {
        await titanUpdateIntegration(editingItem.id, {
          name: values.name,
          authType: values.authType,
          config: configStr,
          status: values.status,
          description: values.description,
        });
        message.success('集成配置已更新');
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

  const handleTest = async (record: TitanListIntegrations200ListItem) => {
    if (!record.id) return;
    setTestingId(record.id);
    try {
      const res = await titanTestIntegration(record.id);
      if (res.success) {
        message.success(`[${record.name}] 集成连通性测试通过！`);
      } else {
        message.error(`集成连通失败: ${res.message || '远程服务响应异常'}`);
      }
    } catch (err: any) {
      message.error(err?.message || '连通性测试出现错误');
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await titanDeleteIntegration(id);
      message.success('集成凭据已删除');
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.message || '删除失败');
    }
  };

  const columns: ProColumns<TitanListIntegrations200ListItem>[] = [
    {
      title: '凭证 ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '集成名称',
      dataIndex: 'name',
      render: (_, record) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
          <Text strong>{record.name}</Text>
        </Space>
      ),
    },
    {
      title: '集成类别',
      dataIndex: 'category',
      width: 200,
      valueType: 'select',
      valueEnum: {
        NACOS: { text: 'Nacos 配置与注册中心' },
        APOLLO: { text: 'Apollo 分布式配置中心' },
        JENKINS: { text: 'Jenkins CI' },
        GIT: { text: 'Git 代码托管' },
        REGISTRY: { text: '镜像仓库 (Harbor)' },
        SONAR: { text: 'SonarQube' },
      },
      render: (_, record) => {
        const meta = getCategoryMeta(record.category);
        return (
          <Tag color={meta.color} icon={meta.icon}>
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: '认证类型',
      dataIndex: 'authType',
      width: 130,
      search: false,
      render: (val) => {
        const type = String(val || 'TOKEN').toUpperCase();
        if (type === 'NONE') {
          return <Tag color="default">免密 (NONE)</Tag>;
        }
        if (type === 'BASIC') {
          return <Tag color="blue">BASIC</Tag>;
        }
        if (type === 'SSH_KEY') {
          return <Tag color="orange">SSH_KEY</Tag>;
        }
        return <Tag color="geekblue">{type}</Tag>;
      },
    },
    {
      title: '配置信息 (已脱敏)',
      dataIndex: 'config',
      search: false,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text code style={{ maxWidth: 280 }} ellipsis>
            {text || '{}'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '凭据状态',
      dataIndex: 'status',
      width: 100,
      search: false,
      render: (status) =>
        status === 1 ? (
          <Badge status="success" text="启用" />
        ) : (
          <Badge status="error" text="停用" />
        ),
    },
    {
      title: '备注说明',
      dataIndex: 'description',
      ellipsis: true,
      search: false,
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
      width: 200,
      render: (_, record) => [
        <Button
          key="test"
          type="link"
          size="small"
          icon={<ThunderboltOutlined />}
          loading={testingId === record.id}
          onClick={() => handleTest(record)}
        >
          连通测试
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
          title="确定删除此集成凭据？"
          description="删除后依赖该凭证的流水线步骤将无法运行！"
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
        title: 'Titan 集成管理 (Toolchain Integrations)',
        subTitle: '统一纳管 Nacos / Apollo 配置中心与服务注册、Jenkins、GitLab、Harbor、SonarQube 等研发基础设施凭证与外部连接器',
      }}
    >
      <ProTable<TitanListIntegrations200ListItem>
        headerTitle="已纳管外部工具与凭据"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 100 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            新建集成凭证
          </Button>,
        ]}
        request={async (params) => {
          try {
            const res = await titanListIntegrations({
              category: params.category,
              page: params.current || 1,
              pageSize: params.pageSize || 20,
            });
            return {
              data: res.list || [],
              success: true,
              total: res.total || 0,
            };
          } catch (err: any) {
            message.error(err?.message || '加载集成列表失败');
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns}
      />

      <Modal
        title={modalMode === 'create' ? '新建第三方集成凭证' : '编辑集成凭据'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={620}
        destroyOnHidden
      >
        <Alert
          title="机密安全声明"
          description="所有 Token、密码与私钥将在服务端采用 AES-GCM 256 位强加密落库，前端读取与日志均执行星号脱敏。"
          type="info"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 16 }}
        />

        <Form
          form={form}
          layout="vertical"
          preserve={false}
          onValuesChange={(changedValues) => {
            if (changedValues.category && modalMode === 'create') {
              if (changedValues.category === 'NACOS') {
                form.setFieldValue('authType', 'NONE');
              } else if (changedValues.category === 'APOLLO') {
                form.setFieldValue('authType', 'TOKEN');
              } else if (changedValues.category === 'JENKINS') {
                form.setFieldValue('authType', 'BASIC');
              }
            }
          }}
        >
          <Form.Item
            name="name"
            label="集成标识名称"
            rules={[{ required: true, message: '请输入集成凭证名称' }]}
          >
            <Input placeholder="如：nacos-prod, apollo-cluster, corp-jenkins, harbor-registry" />
          </Form.Item>

          <Form.Item
            name="category"
            label="集成类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select
              disabled={modalMode === 'edit'}
              options={[
                { label: 'Nacos 配置与注册中心', value: 'NACOS' },
                { label: 'Apollo 分布式配置中心', value: 'APOLLO' },
                { label: 'Jenkins CI 引擎', value: 'JENKINS' },
                { label: 'Git 代码托管平台 (GitLab/GitHub/Gitee)', value: 'GIT' },
                { label: '容器镜像仓库 (Harbor / DockerHub)', value: 'REGISTRY' },
                { label: '静态代码质量检测 (SonarQube)', value: 'SONAR' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="authType"
            label="认证方式"
            rules={[{ required: true, message: '请选择认证方式' }]}
          >
            <Select
              options={[
                { label: '免密 / 内网匿名访问 (NONE)', value: 'NONE' },
                { label: 'Token 访问令牌 (TOKEN)', value: 'TOKEN' },
                { label: 'Basic Auth (账号 + 密码/Token)', value: 'BASIC' },
                { label: 'SSH Private Key (私钥免密)', value: 'SSH_KEY' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="config"
            label="连接与认证配置 (JSON 格式)"
            rules={[{ required: true, message: '请输入配置参数' }]}
            tooltip="包含服务器地址 (url/serverAddr) 及认证密钥 (token/password/username)"
          >
            <Input.TextArea
              rows={6}
              placeholder={getConfigPlaceholder(selectedCategory)}
            />
          </Form.Item>

          {modalMode === 'edit' && (
            <Form.Item name="status" label="凭证状态">
              <Select
                options={[
                  { label: '启用 (ACTIVE)', value: 1 },
                  { label: '停用 (DISABLED)', value: 0 },
                ]}
              />
            </Form.Item>
          )}

          <Form.Item name="description" label="备注说明">
            <Input.TextArea rows={2} placeholder="详细描述该凭证的使用范围与授权账户" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default IntegrationsPage;
