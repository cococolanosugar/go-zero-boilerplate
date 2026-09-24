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
  Tooltip,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
  GithubOutlined,
  ApiOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  ApartmentOutlined,
  SettingOutlined,
  CodeOutlined,
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
import { useIntl } from '../../contexts/LocaleContext';
import { getErrorMessage } from '../../utils/error';

const { Text } = Typography;

// 类别配色与图标（文案统一走 i18n key：titan.integrations.cat*）
const categoryMetaMap: Record<string, { color: string; icon: React.ReactNode; key: string }> = {
  NACOS: { color: 'cyan', icon: <ApartmentOutlined />, key: 'titan.integrations.catNacos' },
  APOLLO: { color: 'magenta', icon: <SettingOutlined />, key: 'titan.integrations.catApollo' },
  JENKINS: { color: 'blue', icon: <ApiOutlined />, key: 'titan.integrations.catJenkins' },
  GIT: { color: 'green', icon: <GithubOutlined />, key: 'titan.integrations.catGit' },
  REGISTRY: { color: 'orange', icon: <DatabaseOutlined />, key: 'titan.integrations.catRegistry' },
  HARBOR: { color: 'orange', icon: <DatabaseOutlined />, key: 'titan.integrations.catHarbor' },
  SONAR: { color: 'purple', icon: <CodeOutlined />, key: 'titan.integrations.catSonar' },
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
  const { formatMessage: t } = useIntl();
  const actionRef = useRef<ActionType>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<TitanListIntegrations200ListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);

  const [form] = Form.useForm();
  const selectedCategory = Form.useWatch('category', form) || 'NACOS';

  const getCategoryMeta = (category?: string) => {
    const key = (category || '').toUpperCase();
    const meta = categoryMetaMap[key];
    return meta || {
      color: 'default',
      icon: <ApiOutlined />,
      key: '',
    };
  };

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
        message.success(t({ id: 'titan.integrations.createSuccess', defaultMessage: '第三方集成凭证已成功纳管' }));
      } else if (editingItem?.id) {
        await titanUpdateIntegration(editingItem.id, {
          name: values.name,
          authType: values.authType,
          config: configStr,
          status: values.status,
          description: values.description,
        });
        message.success(t({ id: 'titan.integrations.updateSuccess', defaultMessage: '集成配置已更新' }));
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
        message.success(
          t({ id: 'titan.integrations.testSuccess', defaultMessage: '[{name}] 集成连通性测试通过！' }, { name: record.name })
        );
      } else {
        message.error(
          t(
            { id: 'titan.integrations.testFailed', defaultMessage: '集成连通失败: {message}' },
            { message: res.message || t({ id: 'titan.integrations.remoteError', defaultMessage: '远程服务响应异常' }) }
          )
        );
      }
    } catch (err) {
      message.error(getErrorMessage(err, t({ id: 'titan.integrations.testError', defaultMessage: '连通性测试出现错误' })));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await titanDeleteIntegration(id);
      message.success(t({ id: 'titan.integrations.deleteSuccess', defaultMessage: '集成凭据已删除' }));
      actionRef.current?.reload();
    } catch (err) {
      message.error(getErrorMessage(err, t({ id: 'titan.common.deleteFailed', defaultMessage: '删除失败' })));
    }
  };

  const columns: ProColumns<TitanListIntegrations200ListItem>[] = [
    {
      title: t({ id: 'titan.integrations.colId', defaultMessage: '凭证 ID' }),
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: t({ id: 'titan.integrations.colName', defaultMessage: '集成名称' }),
      dataIndex: 'name',
      render: (_, record) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
          <Text strong>{record.name}</Text>
        </Space>
      ),
    },
    {
      title: t({ id: 'titan.integrations.colCategory', defaultMessage: '集成类别' }),
      dataIndex: 'category',
      width: 200,
      valueType: 'select',
      valueEnum: {
        NACOS: { text: t({ id: 'titan.integrations.catNacos', defaultMessage: 'Nacos 配置与注册中心' }) },
        APOLLO: { text: t({ id: 'titan.integrations.catApollo', defaultMessage: 'Apollo 分布式配置中心' }) },
        JENKINS: { text: t({ id: 'titan.integrations.catJenkins', defaultMessage: 'Jenkins CI' }) },
        GIT: { text: t({ id: 'titan.integrations.catGit', defaultMessage: 'Git 代码托管' }) },
        REGISTRY: { text: t({ id: 'titan.integrations.catRegistry', defaultMessage: '镜像仓库 (Harbor)' }) },
        SONAR: { text: t({ id: 'titan.integrations.catSonar', defaultMessage: 'SonarQube' }) },
      },
      render: (_, record) => {
        const meta = getCategoryMeta(record.category);
        return (
          <Tag color={meta.color} icon={meta.icon}>
            {meta.key
              ? t({ id: meta.key, defaultMessage: record.category || '' })
              : record.category || t({ id: 'titan.integrations.catFallback', defaultMessage: '其它' })}
          </Tag>
        );
      },
    },
    {
      title: t({ id: 'titan.integrations.colAuthType', defaultMessage: '认证类型' }),
      dataIndex: 'authType',
      width: 130,
      search: false,
      render: (val) => {
        const type = String(val || 'TOKEN').toUpperCase();
        if (type === 'NONE') {
          return <Tag color="default">{t({ id: 'titan.integrations.authNone', defaultMessage: '免密 (NONE)' })}</Tag>;
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
      title: t({ id: 'titan.integrations.colConfig', defaultMessage: '配置信息 (已脱敏)' }),
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
      title: t({ id: 'titan.integrations.colStatus', defaultMessage: '凭据状态' }),
      dataIndex: 'status',
      width: 100,
      search: false,
      render: (status) =>
        status === 1 ? (
          <Badge status="success" text={t({ id: 'titan.integrations.statusEnabled', defaultMessage: '启用' })} />
        ) : (
          <Badge status="error" text={t({ id: 'titan.integrations.statusDisabled', defaultMessage: '停用' })} />
        ),
    },
    {
      title: t({ id: 'titan.integrations.colDescription', defaultMessage: '备注说明' }),
      dataIndex: 'description',
      ellipsis: true,
      search: false,
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
          {t({ id: 'titan.integrations.test', defaultMessage: '连通测试' })}
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
          title={t({ id: 'titan.integrations.deleteConfirmTitle', defaultMessage: '确定删除此集成凭据？' })}
          description={t({ id: 'titan.integrations.deleteConfirmDesc', defaultMessage: '删除后依赖该凭证的流水线步骤将无法运行！' })}
          onConfirm={() => record.id && handleDelete(record.id)}
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
        title: t({ id: 'titan.integrations.title', defaultMessage: 'Titan 集成管理 (Toolchain Integrations)' }),
        subTitle: t({
          id: 'titan.integrations.subTitle',
          defaultMessage:
            '统一纳管 Nacos / Apollo 配置中心与服务注册、Jenkins、GitLab、Harbor、SonarQube 等研发基础设施凭证与外部连接器',
        }),
      }}
    >
      <ProTable<TitanListIntegrations200ListItem>
        headerTitle={t({ id: 'titan.integrations.headerTitle', defaultMessage: '已纳管外部工具与凭据' })}
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 100 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            {t({ id: 'titan.integrations.addAction', defaultMessage: '新建集成凭证' })}
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
            message.error(getErrorMessage(err, t({ id: 'titan.integrations.loadFailed', defaultMessage: '加载集成列表失败' })));
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns}
      />

      <Modal
        title={
          modalMode === 'create'
            ? t({ id: 'titan.integrations.modalCreateTitle', defaultMessage: '新建第三方集成凭证' })
            : t({ id: 'titan.integrations.modalEditTitle', defaultMessage: '编辑集成凭据' })
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={620}
        destroyOnHidden
      >
        <Alert
          title={t({ id: 'titan.integrations.alertTitle', defaultMessage: '机密安全声明' })}
          description={t({
            id: 'titan.integrations.alertDesc',
            defaultMessage:
              '所有 Token、密码与私钥将在服务端采用 AES-GCM 256 位强加密落库，前端读取与日志均执行星号脱敏。',
          })}
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
            label={t({ id: 'titan.integrations.labelName', defaultMessage: '集成标识名称' })}
            rules={[{ required: true, message: t({ id: 'titan.integrations.ruleName', defaultMessage: '请输入集成凭证名称' }) }]}
          >
            <Input placeholder={t({ id: 'titan.integrations.placeholderName', defaultMessage: '如：nacos-prod, apollo-cluster, corp-jenkins, harbor-registry' })} />
          </Form.Item>

          <Form.Item
            name="category"
            label={t({ id: 'titan.integrations.labelCategory', defaultMessage: '集成类别' })}
            rules={[{ required: true, message: t({ id: 'titan.integrations.ruleCategory', defaultMessage: '请选择类别' }) }]}
          >
            <Select
              disabled={modalMode === 'edit'}
              options={[
                { label: t({ id: 'titan.integrations.catNacos', defaultMessage: 'Nacos 配置与注册中心' }), value: 'NACOS' },
                { label: t({ id: 'titan.integrations.catApollo', defaultMessage: 'Apollo 分布式配置中心' }), value: 'APOLLO' },
                { label: t({ id: 'titan.integrations.catJenkins', defaultMessage: 'Jenkins CI 引擎' }), value: 'JENKINS' },
                { label: t({ id: 'titan.integrations.catOptionGit', defaultMessage: 'Git 代码托管平台 (GitLab/GitHub/Gitee)' }), value: 'GIT' },
                { label: t({ id: 'titan.integrations.catOptionRegistry', defaultMessage: '容器镜像仓库 (Harbor / DockerHub)' }), value: 'REGISTRY' },
                { label: t({ id: 'titan.integrations.catOptionSonar', defaultMessage: '静态代码质量检测 (SonarQube)' }), value: 'SONAR' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="authType"
            label={t({ id: 'titan.integrations.labelAuthType', defaultMessage: '认证方式' })}
            rules={[{ required: true, message: t({ id: 'titan.integrations.ruleAuthType', defaultMessage: '请选择认证方式' }) }]}
          >
            <Select
              options={[
                { label: t({ id: 'titan.integrations.authOptionNone', defaultMessage: '免密 / 内网匿名访问 (NONE)' }), value: 'NONE' },
                { label: t({ id: 'titan.integrations.authOptionToken', defaultMessage: 'Token 访问令牌 (TOKEN)' }), value: 'TOKEN' },
                { label: t({ id: 'titan.integrations.authOptionBasic', defaultMessage: 'Basic Auth (账号 + 密码/Token)' }), value: 'BASIC' },
                { label: t({ id: 'titan.integrations.authOptionSshKey', defaultMessage: 'SSH Private Key (私钥免密)' }), value: 'SSH_KEY' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="config"
            label={t({ id: 'titan.integrations.labelConfig', defaultMessage: '连接与认证配置 (JSON 格式)' })}
            rules={[{ required: true, message: t({ id: 'titan.integrations.ruleConfig', defaultMessage: '请输入配置参数' }) }]}
            tooltip={t({
              id: 'titan.integrations.labelConfigTooltip',
              defaultMessage: '包含服务器地址 (url/serverAddr) 及认证密钥 (token/password/username)',
            })}
          >
            <Input.TextArea
              rows={6}
              placeholder={getConfigPlaceholder(selectedCategory)}
            />
          </Form.Item>

          {modalMode === 'edit' && (
            <Form.Item name="status" label={t({ id: 'titan.integrations.labelStatus', defaultMessage: '凭证状态' })}>
              <Select
                options={[
                  { label: t({ id: 'titan.integrations.statusOptionActive', defaultMessage: '启用 (ACTIVE)' }), value: 1 },
                  { label: t({ id: 'titan.integrations.statusOptionDisabled', defaultMessage: '停用 (DISABLED)' }), value: 0 },
                ]}
              />
            </Form.Item>
          )}

          <Form.Item name="description" label={t({ id: 'titan.integrations.labelDescription', defaultMessage: '备注说明' })}>
            <Input.TextArea rows={2} placeholder={t({ id: 'titan.integrations.placeholderDescription', defaultMessage: '详细描述该凭证的使用范围与授权账户' })} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default IntegrationsPage;
