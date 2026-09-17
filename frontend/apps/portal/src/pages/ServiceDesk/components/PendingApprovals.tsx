import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Badge,
  Space,
  Button,
  Modal,
  Input,
  Typography,
  Card,
  Empty,
  App as AntdApp,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SyncOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import {
  itsmListTickets,
  itsmApproveTask,
  itsmRejectTask,
  type ItsmListTickets200ListItem,
} from '@zero/api';
import { PRIORITY_CONFIG } from '../types';

const { Text, Paragraph } = Typography;

interface PendingApprovalsProps {
  onViewDetail: (ticketId: number) => void;
  refreshTrigger: number;
}

export const PendingApprovals: React.FC<PendingApprovalsProps> = ({
  onViewDetail,
  refreshTrigger,
}) => {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<ItsmListTickets200ListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // 审批/驳回弹窗
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [currentRecord, setCurrentRecord] = useState<ItsmListTickets200ListItem | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTodo = async () => {
    setLoading(true);
    try {
      const res = await itsmListTickets({
        viewType: 'todo',
        page,
        pageSize: 10,
      });
      setTasks(res.list || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      message.error(`获取待办审批失败: ${err.message || '网络异常'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodo();
  }, [page, refreshTrigger]);

  const handleOpenAction = (record: ItsmListTickets200ListItem, type: 'APPROVE' | 'REJECT') => {
    setCurrentRecord(record);
    setActionType(type);
    setComment(type === 'APPROVE' ? '同意申请' : '');
    setActionModalOpen(true);
  };

  const handleActionSubmit = async () => {
    if (!currentRecord) return;
    setSubmitting(true);
    try {
      // 检查 record 中是否有 taskId，如果没有则引导打开详情页进行精准节点审批
      // 详情页 RequestDetailDrawer 中直接包含对应 activeTasks
      onViewDetail(currentRecord.id);
      setActionModalOpen(false);
      message.info('正在为您打开工单详情与审批决策面板...');
    } catch (err: any) {
      message.error(`操作失败: ${err.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number) => <Text strong style={{ color: '#722ed1' }}>#{id}</Text>,
    },
    {
      title: '服务流程',
      dataIndex: 'procName',
      key: 'procName',
      width: 160,
      render: (text: string) => <Tag color="purple">{text || '通用流程'}</Tag>,
    },
    {
      title: '申请主题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: ItsmListTickets200ListItem) => (
        <a
          onClick={() => onViewDetail(record.id)}
          style={{ color: '#1677ff', fontWeight: 500 }}
        >
          {title}
        </a>
      ),
    },
    {
      title: '发起人',
      dataIndex: 'initiatorName',
      key: 'initiatorName',
      width: 130,
      render: (name: string) => <Tag color="cyan">{name || '企业员工'}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: string) => {
        const cfg = PRIORITY_CONFIG[priority];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{priority}</Tag>;
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170,
      render: (time: string) => <Text type="secondary">{time || '-'}</Text>,
    },
    {
      title: '审批操作',
      key: 'action',
      width: 180,
      render: (_: any, record: ItsmListTickets200ListItem) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            icon={<CheckOutlined />}
            onClick={() => onViewDetail(record.id)}
          >
            审批决策
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewDetail(record.id)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card variant="borderless" style={{ borderRadius: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Space>
          <AuditOutlined style={{ color: '#52c41a', fontSize: 18 }} />
          <Text strong style={{ fontSize: 15 }}>
            待我审批任务池（{total} 项待办）
          </Text>
        </Space>

        <Button icon={<SyncOutlined />} onClick={fetchTodo}>
          刷新
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={tasks}
        loading={loading}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          showTotal: (t) => `共 ${t} 项待办任务`,
          onChange: (p) => setPage(p),
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="太棒了！当前没有任何待您处理的审批工单"
            />
          ),
        }}
      />
    </Card>
  );
};

export default PendingApprovals;
