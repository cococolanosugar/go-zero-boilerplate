import React, { useRef, useState, useEffect } from 'react';
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
  Card,
  Tooltip,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  itsmListTickets,
  itsmCreateTicket,
  itsmListProcessDefs,
  type ItsmListTickets200ListItem,
  type ItsmListProcessDefs200ListItem,
} from '@zero/api';
import { copyToClipboard } from '@zero/shared';
import { DynamicTicketForm } from '../../../components/DynamicForm';

const priorityTagMap: Record<string, { color: string; label: string }> = {
  P1: { color: 'magenta', label: 'P1 极高' },
  P2: { color: 'orange', label: 'P2 高' },
  P3: { color: 'blue', label: 'P3 中' },
  P4: { color: 'default', label: 'P4 低' },
};

const statusTagMap: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'gold', text: '待派发' },
  RUNNING: { color: 'processing', text: '处理中' },
  APPROVED: { color: 'success', text: '审批通过' },
  REJECTED: { color: 'error', text: '已驳回' },
  REVOKED: { color: 'warning', text: '已撤回' },
  CLOSED: { color: 'default', text: '已关闭' },
};

export const TicketsPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const actionRef = useRef<ActionType>(null);

  const [activeTab, setActiveTab] = useState<string>('todo');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // 流程定义选项
  const [processDefs, setProcessDefs] = useState<ItsmListProcessDefs200ListItem[]>([]);
  const [selectedProcDefId, setSelectedProcDefId] = useState<number | undefined>();
  const [selectedProcDef, setSelectedProcDef] = useState<ItsmListProcessDefs200ListItem | undefined>();

  const [createForm] = Form.useForm();
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});

  useEffect(() => {
    // 加载可用的已发布流程定义
    itsmListProcessDefs({ page: 1, pageSize: 100 })
      .then((res) => {
        const defs = res.list || [];
        setProcessDefs(defs);
        if (defs.length > 0 && !selectedProcDefId) {
          setSelectedProcDefId(defs[0].id);
          setSelectedProcDef(defs[0]);
        }
      })
      .catch(() => {});
  }, []);

  const handleProcChange = (id: number) => {
    setSelectedProcDefId(id);
    const def = processDefs.find((d) => d.id === id);
    setSelectedProcDef(def);
  };

  const handleCreateSubmit = async () => {
    try {
      const baseValues = await createForm.validateFields();
      if (!selectedProcDefId) {
        message.warning('请选择所属服务流程');
        return;
      }

      setCreateSubmitting(true);
      const res = await itsmCreateTicket({
        procDefId: selectedProcDefId,
        title: baseValues.title,
        priority: baseValues.priority || 'P3',
        formDataJson: JSON.stringify(dynamicValues),
      });

      message.success(`工单已成功提报！单号: ${res.ticketNo}`);
      setCreateModalOpen(false);
      createForm.resetFields();
      setDynamicValues({});
      actionRef.current?.reload();
      if (res.id) {
        navigate(`/itsm/tickets/${res.id}`);
      }
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(`提报工单失败: ${err.message || err}`);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const columns: ProColumns<ItsmListTickets200ListItem>[] = [
    {
      title: '工单流水号',
      dataIndex: 'ticketNo',
      width: 170,
      copyable: true,
      render: (dom, record) => (
        <a
          onClick={() => navigate(`/itsm/tickets/${record.id}`)}
          style={{ fontWeight: 600, fontFamily: 'monospace' }}
        >
          {record.ticketNo}
        </a>
      ),
    },
    {
      title: '工单标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (_, record) => (
        <Space orientation="vertical" size={1}>
          <a
            onClick={() => navigate(`/itsm/tickets/${record.id}`)}
            style={{ fontWeight: 500 }}
          >
            {record.title}
          </a>
          {record.procName && (
            <Tag color="cyan" style={{ fontSize: 11, lineHeight: '18px' }}>
              {record.procName}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 90,
      valueType: 'select',
      valueEnum: {
        P1: { text: 'P1 极高', status: 'Error' },
        P2: { text: 'P2 高', status: 'Warning' },
        P3: { text: 'P3 中', status: 'Processing' },
        P4: { text: 'P4 低', status: 'Default' },
      },
      render: (_, record) => {
        const p = priorityTagMap[record.priority] || { color: 'default', label: record.priority };
        return <Tag color={p.color}>{p.label}</Tag>;
      },
    },
    {
      title: '当前节点',
      dataIndex: 'currentNodeName',
      width: 140,
      render: (_, record) => (
        <Tag color="processing" icon={<SyncOutlined spin={record.status === 'RUNNING'} />}>
          {record.currentNodeName || '等待流转'}
        </Tag>
      ),
    },
    {
      title: '工单状态',
      dataIndex: 'status',
      width: 110,
      valueType: 'select',
      valueEnum: {
        RUNNING: { text: '处理中', status: 'Processing' },
        APPROVED: { text: '审批通过', status: 'Success' },
        REJECTED: { text: '已驳回', status: 'Error' },
        REVOKED: { text: '已撤回', status: 'Warning' },
        CLOSED: { text: '已关闭', status: 'Default' },
      },
      render: (_, record) => {
        const s = statusTagMap[record.status] || { color: 'default', text: record.status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: 'SLA 时效状态',
      dataIndex: 'slaStatus',
      width: 120,
      render: (_, record) => {
        if (record.slaStatus === 'TIMEOUT') {
          return <Badge status="error" text="SLA 已超时" />;
        }
        if (record.slaStatus === 'WARNING') {
          return <Badge status="warning" text="SLA 临近预警" />;
        }
        return <Badge status="success" text="SLA 履约正常" />;
      },
    },
    {
      title: '解决截止期限',
      dataIndex: 'slaResolveDeadline',
      width: 160,
      search: false,
      render: (_, record) => (
        <span style={{ fontSize: 13, color: '#666' }}>
          {record.slaResolveDeadline || '-'}
        </span>
      ),
    },
    {
      title: '提报时间',
      dataIndex: 'createTime',
      width: 160,
      search: false,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <Button
          key="detail"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/itsm/tickets/${record.id}`)}
        >
          办理/详情
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer
      title="ITSM 服务工单工作台"
      subTitle="涵盖我的待办、我的已办、我发起的及 SLA 预警工单全生命周期视图"
      tabList={[
        { key: 'todo', tab: '我的待办' },
        { key: 'done', tab: '我的已办' },
        { key: 'my_submitted', tab: '我发起的' },
        { key: 'all', tab: '全部工单' },
        { key: 'sla_warning', tab: 'SLA 预警工单' },
      ]}
      tabActiveKey={activeTab}
      onTabChange={(key) => {
        setActiveTab(key);
        actionRef.current?.reload();
      }}
      extra={[
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            createForm.resetFields();
            setCreateModalOpen(true);
          }}
        >
          提报新工单
        </Button>,
      ]}
    >
      <ProTable<ItsmListTickets200ListItem>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await itsmListTickets({
            page: params.current || 1,
            pageSize: params.pageSize || 10,
            viewType: activeTab,
            priority: params.priority,
            status: params.status,
            keyword: params.title || params.ticketNo,
          });
          return {
            data: res.list || [],
            total: res.total || 0,
            success: true,
          };
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        cardBordered={false}
      />

      {/* 提报新工单弹窗 */}
      <Modal
        title="提报新服务工单"
        width={760}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreateSubmit}
        confirmLoading={createSubmitting}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ priority: 'P3' }}
        >
          <Form.Item
            label="所属服务流程"
            rules={[{ required: true, message: '请选择服务流程' }]}
          >
            <Select
              placeholder="请选择所需提报的服务目录与流程"
              value={selectedProcDefId}
              onChange={handleProcChange}
              options={processDefs.map((d) => ({
                label: `${d.procName} (${d.procCode}) - v${d.version}`,
                value: d.id,
              }))}
            />
          </Form.Item>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item
              label="工单标题"
              name="title"
              style={{ width: 440 }}
              rules={[{ required: true, message: '请输入工单标题' }]}
            >
              <Input placeholder="例如: 生产数据库只读从库账号开通申请" />
            </Form.Item>

            <Form.Item
              label="优先级"
              name="priority"
              style={{ width: 220 }}
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { label: 'P1 极高 (1小时响应)', value: 'P1' },
                  { label: 'P2 高优先级 (2小时响应)', value: 'P2' },
                  { label: 'P3 中优先级 (4小时响应)', value: 'P3' },
                  { label: 'P4 低优先级 (8小时响应)', value: 'P4' },
                ]}
              />
            </Form.Item>
          </Space>

          <Divider style={{ margin: '8px 0 16px 0', fontSize: 13 }}>
            业务表单字段
          </Divider>

          <DynamicTicketForm
            schema={selectedProcDef?.formSchema}
            initialValues={dynamicValues}
            readonly={false}
            onFinish={async (values) => {
              setDynamicValues(values);
            }}
          />
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default TicketsPage;
