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
import { getErrorMessage } from '../utils/error';

const { Text } = Typography;

const categoryMetaMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  JENKINS: { label: 'Jenkins CI', color: 'blue', icon: <ApiOutlined /> },
  GIT: { label: 'Git 仓库 (GitLab/GitHub)', color: 'green', icon: <GithubOutlined /> },
  REGISTRY: { label: '镜像仓库 (Harbor/Docker)', color: 'orange', icon: <DatabaseOutlined /> },
  SONAR: { label: '代码扫描 (SonarQube)', color: 'purple', icon: <CodeOutlined /> },
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
  const selectedCategory = Form.useWatch('category', form) || 'JENKINS';

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      category: 'JENKINS',
      authType: 'BASIC',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (record: TitanListIntegrations200ListItem) => {
    setModalMode('edit');
    setEditingItem(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      category: record.category,
      authType: record.authType,
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
          category: values.category,
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
    } catch (err) {
      const errMsg = getErrorMessage(err, '');
      if (errMsg) {
        message.error(errMsg);
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
    } catch (err) {
      message.error(getErrorMessage(err, '连通性测试出现错误'));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await titanDeleteIntegration(id);
      message.success('集成凭据已删除');
      actionRef.current?.reload();
    } catch (err) {
      message.error(getErrorMessage(err, '删除失败'));
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
      width: 180,
      valueType: 'select',
      valueEnum: {
        JENKINS: { text: 'Jenkins CI' },
        GIT: { text: 'Git 代码托管' },
        REGISTRY: { text: '镜像仓库 (Harbor)' },
        SONAR: { text: 'SonarQube' },
      },
      render: (_, record) => {
        const meta = categoryMetaMap[record.category || ''] || {
          label: record.category || '其它',
          color: 'default',
          icon: <ApiOutlined />,
        };
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
      width: 120,
      search: false,
      render: (val) => <Tag color="geekblue">{val || 'TOKEN'}</Tag>,
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
        subTitle: '纳管 Jenkins、GitLab、Harbor、SonarQube 等关键研发基础设施凭证与外部连接器',
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
          } catch (err) {
            message.error(getErrorMessage(err, '加载集成列表失败'));
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

        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="集成标识名称"
            rules={[{ required: true, message: '请输入集成凭证名称' }]}
          >
            <Input placeholder="如：corp-jenkins-master, gitlab-deployer, harbor-prod" />
          </Form.Item>

          <Form.Item
            name="category"
            label="集成类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select
              disabled={modalMode === 'edit'}
              options={[
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
                { label: 'Basic Auth (账号 + 密码/Token)', value: 'BASIC' },
                { label: 'Personal Access Token (单 Token)', value: 'TOKEN' },
                { label: 'SSH Private Key (私钥免密)', value: 'SSH_KEY' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="config"
            label="连接与认证配置 (JSON 格式)"
            rules={[{ required: true, message: '请输入配置参数' }]}
            tooltip="包含服务器地址 (url) 及认证密钥 (token/password/username)"
          >
            <Input.TextArea
              rows={6}
              placeholder={
                selectedCategory === 'JENKINS'
                  ? '{\n  "url": "http://10.0.0.10:8080",\n  "username": "admin",\n  "apiToken": "11xxxxxx"\n}'
                  : selectedCategory === 'REGISTRY'
                  ? '{\n  "url": "harbor.internal.net",\n  "username": "robot$deploy",\n  "password": "SecretPassword"\n}'
                  : '{\n  "url": "https://gitlab.internal.net",\n  "token": "glpat-xxxxxxxx"\n}'
              }
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
